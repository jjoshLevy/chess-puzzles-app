import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './db';
import { puzzles, users } from './db/schema'; // Import the new users table
import { sql, and, gte, lte, or, like, eq } from 'drizzle-orm';

const app = express();
const port = 3000;

// This allows our server to read JSON data from POST requests
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));

const difficultyRatingMap = {
    easy: { min: 400, max: 1200 },
    medium: { min: 1201, max: 1800 },
    hard: { min: 1801, max: 3000 },
};

// --- THIS IS THE NEW USER RATING ENDPOINT ---
app.get("/api/user/rating", async (req: Request, res: Response) => {
    try {
        // For now, we will hardcode a single default user.
        // Later, this would use the logged-in user's ID.
        let user = await db.query.users.findFirst({ where: eq(users.username, 'default_user') });

        // If the default user doesn't exist, create them.
        if (!user) {
            console.log("Default user not found, creating one...");
            const newUserResult = await db.insert(users).values({ username: 'default_user' }).returning();
            user = newUserResult[0];
        }

        res.json({ rating: user.rating });

    } catch (error) {
        console.error("Error fetching user rating:", error);
        res.status(500).json({ error: "Failed to fetch user rating." });
    }
});


// This is your existing puzzle filter API (no changes needed)
app.get("/api/puzzles", async (req: Request, res: Response) => {
    try {
        const { difficulties, themes } = req.query;
        const conditions = [];
        if (difficulties && typeof difficulties === 'string' && difficulties.length > 0) {
            const difficultyList = difficulties.split(',');
            const difficultyConditions = difficultyList.map(diff => {
                const range = difficultyRatingMap[diff as keyof typeof difficultyRatingMap];
                if (range) { return and(gte(puzzles.rating, range.min), lte(puzzles.rating, range.max)); }
                return null;
            }).filter(Boolean);
            if (difficultyConditions.length > 0) { conditions.push(or(...difficultyConditions as any)); }
        }
        if (themes && typeof themes === 'string' && themes.length > 0) {
            const themeList = themes.split(',');
            const themeConditions = themeList.map(theme => like(puzzles.themes, `%${theme.trim()}%`));
            if (themeConditions.length > 0) { conditions.push(or(...themeConditions)); }
        }
        const query = db.select().from(puzzles).where(and(...conditions)).orderBy(sql`RANDOM()`).limit(1);
        const result = await query;
        if (result.length === 0) {
            return res.status(404).json({ error: "No puzzles found matching your criteria." });
        }
        res.json(result[0]);
    } catch (error) {
        console.error("Error fetching filtered puzzle:", error);
        res.status(500).json({ error: "Failed to fetch puzzle from database." });
    }
});

// --- THIS IS THE NEW PUZZLE SOLVE / RATING UPDATE ENDPOINT ---
app.post("/api/puzzles/:puzzleId/solve", async (req: Request, res: Response) => {
    try {
        const { puzzleId } = req.params;
        const { solved } = req.body; // Did the user get it right or wrong?

        // 1. Get the puzzle and the user from the database
        const puzzle = await db.query.puzzles.findFirst({ where: eq(puzzles.puzzleId, puzzleId) });
        const user = await db.query.users.findFirst({ where: eq(users.username, 'default_user') });

        if (!puzzle || !user) {
            return res.status(404).json({ error: "User or puzzle not found." });
        }

        // 2. Simple Glicko-style rating calculation
        const K = 32; // K-factor determines how much the rating changes
        const userRating = user.rating;
        const puzzleRating = puzzle.rating;

        // Calculate expected score
        const expectedScore = 1 / (1 + Math.pow(10, (puzzleRating - userRating) / 400));
        
        // Actual score is 1 for a win (solved), 0 for a loss
        const actualScore = solved ? 1 : 0;

        // Calculate the new rating
        const newRating = Math.round(userRating + K * (actualScore - expectedScore));
        
        // 3. Update the user's rating in the database
        await db.update(users).set({ rating: newRating }).where(eq(users.id, user.id));

        console.log(`Rating updated for ${user.username}: ${userRating} -> ${newRating}`);
        res.json({ newRating, change: newRating - userRating });

    } catch (error) {
        console.error("Error updating rating:", error);
        res.status(500).json({ error: "Failed to update rating." });
    }
});


// This catch-all route remains the same
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
});

app.listen(port, () => {
    console.log(`[0] Server listening on http://localhost:${port}`);
});
import express from 'express';
import { db } from './db';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const clientDistPath = path.resolve(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

// Improved /api/puzzles endpoint with filters support
app.get('/api/puzzles', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    let query = "SELECT * FROM Puzzle WHERE FEN IS NOT NULL AND FEN != '' AND Moves IS NOT NULL AND Moves != ''";
    const params: any[] = [];

    // Difficulty filter
    if (req.query.difficulties) {
      const difficulties = String(req.query.difficulties).split(',');
      const ranges: Record<string, [number, number]> = {
        easy: [400, 1200],
        medium: [1201, 1800],
        hard: [1801, 3000],
      };
      const ratingConditions = difficulties
        .filter(d => ranges[d])
        .map(d => `(Rating >= ${ranges[d][0]} AND Rating <= ${ranges[d][1]})`);
      if (ratingConditions.length > 0) {
        query += " AND (" + ratingConditions.join(" OR ") + ")";
      }
    }

    // Theme filter
    if (req.query.themes) {
      const themes = String(req.query.themes).split(',');
      if (themes.length > 0) {
        query += " AND (" + themes.map(() => "Themes LIKE ?").join(" OR ") + ")";
        themes.forEach(theme => params.push(`%${theme}%`));
      }
    }

    query += " ORDER BY RANDOM() LIMIT 1";
    const stmnt = db.prepare(query);
    const puzzle = stmnt.get(...params);

    if (puzzle) {
      res.json(puzzle);
    } else {
      res.status(404).json({ error: "Could not find any complete puzzles in the database." });
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Error fetching puzzle' });
  }
});

// Endpoint to update user rating after solving a puzzle
app.post('/api/puzzles/:id/solve', (req, res) => {
  const { userId = "default", solved } = req.body;
  const puzzleId = req.params.id;

  // Get puzzle difficulty (rating)
  const puzzle = db.prepare("SELECT Rating FROM Puzzle WHERE PuzzleId = ?").get(puzzleId);
  if (!puzzle) return res.status(404).json({ error: "Puzzle not found" });

  // Get or create user rating
  let user = db.prepare("SELECT rating FROM UserRating WHERE userId = ?").get(userId);
  if (!user) {
    db.prepare("INSERT INTO UserRating (userId, rating) VALUES (?, 1500)").run(userId);
    user = { rating: 1500 };
  }

  // Elo-like calculation
  const K = 32;
  const puzzleRating = puzzle.Rating;
  const expected = 1 / (1 + Math.pow(10, (puzzleRating - user.rating) / 400));
  const score = solved ? 1 : 0;
  const newRating = Math.round(user.rating + K * (score - expected));

  db.prepare("UPDATE UserRating SET rating = ? WHERE userId = ?").run(newRating, userId);

  res.json({ newRating });
});

// Endpoint for user rating (returns real rating)
app.get('/api/user/rating', (req, res) => {
  const userId = "default";
  let user = db.prepare("SELECT rating FROM UserRating WHERE userId = ?").get(userId);
  if (!user) {
    db.prepare("INSERT INTO UserRating (userId, rating) VALUES (?, 1500)").run(userId);
    user = { rating: 1500 };
  }
  res.setHeader('Cache-control', 'no-store');
  res.json({ rating: user.rating });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[server]: Server is running at http://localhost:${PORT}`);
});
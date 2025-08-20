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
      // Map difficulty to rating ranges
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

// Mock endpoint for user rating
app.get('/api/user/rating', (req, res) => {
    res.setHeader('Cache-control', 'no-store');
    res.json({ rating: 1500 });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[server]: Server is running at http://localhost:${PORT}`);
});
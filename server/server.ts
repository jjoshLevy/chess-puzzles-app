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

app.get('/api/puzzles', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    // --- THIS IS THE FINAL FIX ---
    // This query now explicitly filters out any puzzles that are missing
    // the essential FEN or Moves data.
    const stmnt = db.prepare(
        "SELECT * FROM Puzzle WHERE FEN IS NOT NULL AND FEN != '' AND Moves IS NOT NULL AND Moves != '' ORDER BY RANDOM() LIMIT 1"
    );
    // -----------------------------

    const puzzle = stmnt.get();
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
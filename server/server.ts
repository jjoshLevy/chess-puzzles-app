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
  
// Ensure required tables exist (SQLite)
try {
  // UserRating table to store current user rating
  db.exec(`
    CREATE TABLE IF NOT EXISTS UserRating (
      userId TEXT PRIMARY KEY,
      rating INTEGER DEFAULT 1500
    );
  `);

  // SolveHistory table to record solve events with timestamps
  db.exec(`
    CREATE TABLE IF NOT EXISTS SolveHistory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT NOT NULL,
      puzzleId TEXT NOT NULL,
      solved INTEGER NOT NULL,
      solveTime INTEGER,
      attempts INTEGER DEFAULT 1,
      solvedAt TEXT DEFAULT (datetime('now'))
    );
  `);
} catch (e) {
  console.error('Failed to ensure required tables exist:', e);
}

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
  const { userId = "default", solved, solveTime, attempts } = req.body;
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

  // Record solve event in history
  try {
    db.prepare(
      "INSERT INTO SolveHistory (userId, puzzleId, solved, solveTime, attempts) VALUES (?, ?, ?, ?, ?)"
    ).run(userId, puzzleId, solved ? 1 : 0, solveTime ?? null, attempts ?? 1);
  } catch (e) {
    console.error('Failed to record solve history:', e);
  }

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

// Aggregate user statistics
app.get('/api/stats', (req, res) => {
  const userId = "default";
  res.setHeader('Cache-Control', 'no-store');
  try {
    // Ensure user rating exists
    let user = db.prepare("SELECT rating FROM UserRating WHERE userId = ?").get(userId);
    if (!user) {
      db.prepare("INSERT INTO UserRating (userId, rating) VALUES (?, 1500)").run(userId);
      user = { rating: 1500 } as any;
    }

    // Total solved
    const totalSolvedRow = db.prepare(
      "SELECT COUNT(*) AS cnt FROM SolveHistory WHERE userId = ? AND solved = 1"
    ).get(userId) as any;
    const totalSolved = totalSolvedRow?.cnt ?? 0;

    // Average solve time (in seconds)
    const times = db.prepare(
      "SELECT solveTime FROM SolveHistory WHERE userId = ? AND solved = 1 AND solveTime IS NOT NULL"
    ).all(userId) as Array<{ solveTime: number }>;
    let averageSolveTime: number | null = null;
    if (times.length > 0) {
      const sum = times.reduce((s, r) => s + (Number(r.solveTime) || 0), 0);
      averageSolveTime = Math.round(sum / times.length);
    }

    // Solves by hour (0-23)
    const hourRows = db.prepare(
      "SELECT strftime('%H', solvedAt) AS hour, COUNT(*) AS cnt FROM SolveHistory WHERE userId = ? AND solved = 1 GROUP BY hour"
    ).all(userId) as Array<{ hour: string; cnt: number }>;
    const byHourMap = new Map<number, number>();
    for (let h = 0; h < 24; h++) byHourMap.set(h, 0);
    for (const r of hourRows) {
      const h = Number(r.hour);
      if (!Number.isNaN(h)) byHourMap.set(h, (byHourMap.get(h) || 0) + (Number(r.cnt) || 0));
    }
    const solvesByHour = Array.from(byHourMap.entries()).map(([hour, count]) => ({ hour, count }));
    const mostActiveHour = solvesByHour.reduce((a, b) => (b.count > a.count ? b : a), { hour: 0, count: 0 });

    // Best theme and top themes
    const solvedPuzzles = db.prepare(
      "SELECT puzzleId FROM SolveHistory WHERE userId = ? AND solved = 1"
    ).all(userId) as Array<{ puzzleId: string }>;
    const themeCounts: Record<string, number> = {};
    for (const r of solvedPuzzles) {
      const p = db.prepare("SELECT Themes FROM Puzzle WHERE PuzzleId = ?").get(r.puzzleId) as any;
      if (!p || !p.Themes) continue;
      const tokens = String(p.Themes).split(/[ ,;]+/).filter(Boolean);
      for (const t of tokens) themeCounts[t] = (themeCounts[t] || 0) + 1;
    }
    const topThemes = Object.entries(themeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([theme, count]) => ({ theme, count }));
    const bestTheme = topThemes.length > 0 ? topThemes[0] : null;

    res.json({
      rating: user?.rating ?? 1500,
      totalSolved,
      averageSolveTime,
      solvesByHour,
      mostActiveHour,
      bestTheme,
      topThemes,
    });
  } catch (err: any) {
    console.error('Failed to compute stats:', err);
    res.status(500).json({ error: 'Failed to compute stats' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[server]: Server is running at http://localhost:${PORT}`);
});
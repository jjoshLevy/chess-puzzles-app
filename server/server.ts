import express, { Request, Response } from 'express';

const app = express();
const port = 3000; // Define a port for the server

// A simple route to confirm the server is running
app.get("/", (req: Request, res: Response) => {
    res.send("Server is running!");
});

// API route for a sample puzzle
app.get("/api/puzzles/:id", (req: Request, res: Response) => {
    const puzzleId = parseInt(req.params.id, 10);
    const samplePuzzle = {
        id: isNaN(puzzleId) ? 1 : puzzleId,
        title: "Sample Puzzle",
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        solution: JSON.stringify(["e2e4"]),
    };
    res.json(samplePuzzle);
});

app.listen(port, () => {
    console.log(`[0] Server listening on http://localhost:${port}`);
});
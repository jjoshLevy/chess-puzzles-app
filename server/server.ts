// Use 'require' instead of 'import' for compatibility
const express = require('express');

// We need to import the types for Request and Response from Express
import { Request, Response } from 'express';

const app = express();
const port = 3000; // Define a port for the server

// A simple route to confirm the server is running
// ADDED TYPES: We now specify that req is a Request and res is a Response
app.get("/", (req: Request, res: Response) => {
    res.send("Server is running!");
});

// API route for a sample puzzle
// ADDED TYPES: We now specify the types for req and res here as well
app.get("/api/puzzles/:id", (req: Request, res: Response) => {
    const puzzleId = parseInt(req.params.id, 10);
    const samplePuzzle = {
        id: isNaN(puzzleId) ? 1 : puzzleId,
        title: "Sample Mate in 1",
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        solution: JSON.stringify(["e2e4"]),
    };
    res.json(samplePuzzle);
});

app.listen(port, () => {
    console.log(`[0] Server listening on http://localhost:${port}`);
});
import { useState } from "react";
import { ChessBoard } from "@/components/chess-board";
import { isBlackToMove } from "@/lib/chess-utils";

const sampleFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export default function ChessPuzzles() {
  const [fen, setFen] = useState(sampleFen);

  const handleMove = (from: string, to: string) => {
    console.log(`A move was made from ${from} to ${to}`);
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#333', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h1 style={{ color: 'white', marginBottom: '20px' }}>Chess Puzzle App</h1>
      
      <div style={{ width: 'clamp(300px, 80vw, 600px)' }}>
        <ChessBoard
          fen={fen}
          onMove={handleMove}
          flipped={isBlackToMove(fen)}
        />
      </div>

      <div style={{ color: 'white', marginTop: '20px', fontFamily: 'monospace' }}>
        <p>Current FEN: {fen}</p>
      </div>
    </div>
  );
}
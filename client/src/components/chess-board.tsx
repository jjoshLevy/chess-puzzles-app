import { useState, useRef } from "react";
import { fenToBoard, squareToIndices, indicesToSquare, getPieceSymbol, isLightSquare, type ChessPiece } from "@/lib/chess-utils";

interface Arrow {
  from: string;
  to: string;
  color?: string;
}

interface ChessBoardProps {
  fen: string;
  onMove?: (from: string, to: string) => void;
  highlightedSquares?: string[];
  arrows?: Arrow[];
  disabled?: boolean;
  flipped?: boolean;
}

export function ChessBoard({ fen, onMove, highlightedSquares = [], arrows = [], disabled = false, flipped = false }: ChessBoardProps) {
  const [draggedPiece, setDraggedPiece] = useState<{ square: string; piece: ChessPiece } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const board = fenToBoard(fen);
  const files = flipped ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'] : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = flipped ? ['1', '2', '3', '4', '5', '6', '7', '8'] : ['8', '7', '6', '5', '4', '3', '2', '1'];

  const handleMouseDown = (e: React.MouseEvent, square: string, piece: ChessPiece) => {
    if (disabled) return;
    setDraggedPiece({ square, piece });
  };

  const handleMouseUp = (targetSquare: string) => {
    if (!draggedPiece || disabled) return;
    if (draggedPiece.square !== targetSquare) {
      onMove?.(draggedPiece.square, targetSquare);
    }
    setDraggedPiece(null);
  };

  const renderSquare = (rank: string, file: string) => {
    const square = `${file}${rank}`;
    const [rankIndex, fileIndex] = squareToIndices(square);
    const piece = board[rankIndex][fileIndex];
    const isLight = isLightSquare(rankIndex, fileIndex);
    const isHighlighted = highlightedSquares.includes(square);

    return (
      <div
        key={square}
        className={`
          aspect-square flex items-center justify-center text-4xl font-bold cursor-pointer relative
          ${isLight ? 'bg-amber-100' : 'bg-amber-800'}
          ${isHighlighted ? 'ring-4 ring-blue-500 ring-inset' : ''}
        `}
        onMouseDown={(e) => piece && handleMouseDown(e, square, piece)}
        onMouseUp={() => handleMouseUp(square)}
        onDragOver={(e) => e.preventDefault()} // Allow drop
      >
        {piece && (
          <span className="select-none pointer-events-none">
            {getPieceSymbol(piece)}
          </span>
        )}
      </div>
    );
  };

  return (
    <div
      ref={boardRef}
      className="grid grid-cols-8 border-4 border-amber-900 shadow-2xl relative"
      onMouseUp={() => setDraggedPiece(null)}
      onMouseLeave={() => setDraggedPiece(null)}
    >
      {ranks.map((rank) =>
        files.map((file) => renderSquare(rank, file))
      )}
    </div>
  );
}
import { useState, useCallback } from "react";
import { fenToBoard, squareToIndices, indicesToSquare, getPieceSymbol, isLightSquare, getPossibleMoves, isBlackToMove, type ChessPiece } from "@/lib/chess-utils";
import { cn } from "@/lib/utils";

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
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<string[]>([]);
  const [draggedPiece, setDraggedPiece] = useState<{ square: string; piece: ChessPiece } | null>(null);
  
  const board = fenToBoard(fen);
  
  const handleSquareClick = useCallback((rank: number, file: number) => {
    if (disabled) return;
    const square = indicesToSquare(rank, file);
    const piece = board[rank][file];
    const playerColor = isBlackToMove(fen) ? 'black' : 'white';
    if (selectedSquare) {
      if (selectedSquare === square) { setSelectedSquare(null); setPossibleMoves([]); }
      else if (possibleMoves.includes(square)) { onMove?.(selectedSquare, square); setSelectedSquare(null); setPossibleMoves([]); }
      else if (piece && piece.color === playerColor) { setSelectedSquare(square); setPossibleMoves(getPossibleMoves(board, square)); }
      else { setSelectedSquare(null); setPossibleMoves([]); }
    } else if (piece && piece.color === playerColor) { setSelectedSquare(square); setPossibleMoves(getPossibleMoves(board, square)); }
  }, [board, selectedSquare, possibleMoves, onMove, disabled, fen]);

  const handleDragStart = useCallback((e: React.DragEvent, rank: number, file: number) => {
    if (disabled) return;
    const square = indicesToSquare(rank, file);
    const piece = board[rank][file];
    const playerColor = isBlackToMove(fen) ? 'black' : 'white';
    if (piece && piece.color === playerColor) {
      setDraggedPiece({ square, piece });
      setSelectedSquare(square);
      setPossibleMoves(getPossibleMoves(board, square));
      const dragImage = document.createElement('div');
      dragImage.style.cssText = "position:absolute; top:-1000px; left:-1000px; width:60px; height:60px; font-size:56px; text-align:center; line-height:70px; text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;";
      dragImage.textContent = getPieceSymbol(piece);
      document.body.appendChild(dragImage);
      e.dataTransfer.setDragImage(dragImage, 30, 30);
      setTimeout(() => { if (document.body.contains(dragImage)) { document.body.removeChild(dragImage); } }, 0);
    } else { e.preventDefault(); }
  }, [board, disabled, fen]);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); }, []);
  const handleDragEnd = useCallback(() => { setDraggedPiece(null); setSelectedSquare(null); setPossibleMoves([]); }, []);
  const handleDrop = useCallback((e: React.DragEvent, rank: number, file: number) => {
    e.preventDefault();
    if (!draggedPiece || disabled) return;
    const targetSquare = indicesToSquare(rank, file);
    if (possibleMoves.includes(targetSquare)) {
      onMove?.(draggedPiece.square, targetSquare);
    }
    setDraggedPiece(null); setSelectedSquare(null); setPossibleMoves([]);
  }, [draggedPiece, possibleMoves, onMove, disabled]);

  const displayBoard = flipped ? [...board].reverse().map(row => [...row].reverse()) : board;
  const getDisplaySquare = (displayRank: number, displayFile: number) => {
    return flipped ? indicesToSquare(7 - displayRank, 7 - displayFile) : indicesToSquare(displayRank, displayFile);
  };

  return (
    <div className="relative flex justify-center">
      <div className="chess-board grid grid-cols-8 border-2 border-gray-800 w-full max-w-lg mx-auto">
        {displayBoard.map((row, displayRank) =>
          row.map((piece, displayFile) => {
            const square = getDisplaySquare(displayRank, displayFile);
            const [actualRank, actualFile] = squareToIndices(square);
            const isLight = isLightSquare(actualRank, actualFile);
            const isSelected = selectedSquare === square;
            const isPossibleMove = possibleMoves.includes(square);
            const isHighlighted = highlightedSquares.includes(square);

            return (
              <div
                key={square}
                className={cn(
                  "chess-square aspect-square flex items-center justify-center relative cursor-pointer transition-all duration-200",
                  isLight ? "bg-yellow-50" : "bg-amber-600",
                  isSelected && "ring-4 ring-blue-500 ring-inset bg-blue-200",
                  isPossibleMove && !piece && "ring-4 ring-green-400 ring-inset bg-green-100/50",
                  isPossibleMove && piece && "ring-4 ring-red-400 ring-inset bg-red-100/50",
                  // --- THIS IS THE ONLY CHANGE ---
                  isHighlighted && "bg-green-500/50", // Changed from bg-yellow-400/50
                  !disabled && "hover:ring-2 hover:ring-blue-400 hover:ring-inset",
                  disabled && "cursor-not-allowed opacity-75",
                  draggedPiece && possibleMoves.includes(square) && "ring-4 ring-blue-400 ring-inset bg-blue-100/30"
                )}
                onClick={() => handleSquareClick(actualRank, actualFile)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, actualRank, actualFile)}
                data-square={square}
              >
                {isPossibleMove && !piece && (
                  <div className="absolute inset-0 flex items-center justify-center"><div className="w-4 h-4 bg-green-500 rounded-full opacity-80"></div></div>
                )}
                {isPossibleMove && piece && (
                  <div className="absolute inset-0">
                    <div className="absolute top-1 left-1 w-2 h-2 bg-red-500 rotate-45"></div><div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rotate-45"></div>
                    <div className="absolute bottom-1 left-1 w-2 h-2 bg-red-500 rotate-45"></div><div className="absolute bottom-1 right-1 w-2 h-2 bg-red-500 rotate-45"></div>
                  </div>
                )}
                {piece && (
                  <span
                    draggable={!disabled}
                    onDragStart={(e) => handleDragStart(e, actualRank, actualFile)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      "chess-piece text-5xl leading-none select-none transition-all duration-200 relative z-10",
                      piece.color === 'white' ? "text-white" : "text-black",
                      !disabled && "hover:scale-105 cursor-grab active:cursor-grabbing",
                      draggedPiece?.square === square && "opacity-0",
                      disabled && "cursor-not-allowed"
                    )}
                    style={{
                      filter: 'none', fontWeight: piece.color === 'white' ? '300' : '400', WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale',
                      textShadow: piece.color === 'white' ? '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' : 'none'
                    }}
                  >{getPieceSymbol(piece)}</span>
                )}
              </div>
            );
          })
        )}
      </div>
      
      {arrows.length > 0 && (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <svg width="100%" height="100%" viewBox="0 0 8 8" style={{ transform: flipped ? 'rotate(180deg)' : 'none' }}>
            <defs>
              {arrows.map((arrow, index) => (
                <marker key={index} id={`arrowhead-${index}`} markerWidth="2" markerHeight="2.5" refX="1.5" refY="1.25" orient="auto">
                  <polygon points="0 0, 2 1.25, 0 2.5" fill={arrow.color || '#ef4444'} />
                </marker>
              ))}
            </defs>
            {arrows.map((arrow, index) => {
              const fromIndices = squareToIndices(arrow.from); const toIndices = squareToIndices(arrow.to);
              const fromX = fromIndices[1] + 0.5; const fromY = 7 - fromIndices[0] + 0.5;
              const toX = toIndices[1] + 0.5; const toY = 7 - toIndices[0] + 0.5;
              return <line key={index} x1={fromX} y1={fromY} x2={toX} y2={toY} stroke={arrow.color || '#ef4444'} strokeWidth="0.2" markerEnd={`url(#arrowhead-${index})`} />;
            })}
          </svg>
        </div>
      )}
    </div>
  );
}
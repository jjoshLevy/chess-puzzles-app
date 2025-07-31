import { useState, useCallback, useEffect } from "react";
import { fenToBoard, squareToIndices, indicesToSquare, getPieceSymbol, isLightSquare, getPossibleMoves, isBlackToMove, type ChessPiece } from "@/lib/chess-utils";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Arrow { from: string; to: string; color?: string; }
interface ChessBoardProps {
  fen: string; onMove?: (from: string, to: string) => void;
  highlightedSquares?: string[]; arrows?: Arrow[]; disabled?: boolean; flipped?: boolean;
}

export function ChessBoard({ fen, onMove, highlightedSquares = [], arrows = [], disabled = false, flipped = false }: ChessBoardProps) {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<string[]>([]);
  const [draggedPiece, setDraggedPiece] = useState<{ square: string; piece: ChessPiece } | null>(null);
  const { toast } = useToast();
  
  const board = fenToBoard(fen);
  
  useEffect(() => { setSelectedSquare(null); setPossibleMoves([]); }, [fen]);
  
  const handleSquareClick = useCallback((rank: number, file: number) => {
    if (disabled) return;
    const square = indicesToSquare(rank, file);
    const piece = board[rank][file];
    const playerColor = isBlackToMove(fen) ? 'black' : 'white';
    
    if (selectedSquare) {
      if (selectedSquare === square) { setSelectedSquare(null); setPossibleMoves([]); }
      else if (possibleMoves.includes(square)) { onMove?.(selectedSquare, square); setSelectedSquare(null); setPossibleMoves([]); }
      else if (piece && piece.color === playerColor) { setSelectedSquare(square); setPossibleMoves(getPossibleMoves(fen, square)); }
      else { setSelectedSquare(null); setPossibleMoves([]); }
    } else if (piece && piece.color === playerColor) {
      setSelectedSquare(square);
      setPossibleMoves(getPossibleMoves(fen, square));
    }
  }, [board, selectedSquare, possibleMoves, onMove, disabled, fen]);

  const handleDragStart = useCallback((e: React.DragEvent, rank: number, file: number) => {
    if (disabled) return;
    const square = indicesToSquare(rank, file);
    const piece = board[rank][file];
    const playerColor = isBlackToMove(fen) ? 'black' : 'white';
    if (piece && piece.color === playerColor) {
      setDraggedPiece({ square, piece });
      setSelectedSquare(square);
      setPossibleMoves(getPossibleMoves(fen, square));
      const dragImage = document.createElement('div');
      dragImage.style.cssText = "position:absolute; top:-1000px; left:-1000px; width:60px; height:60px; font-size:56px; text-align:center; line-height:70px; text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;";
      dragImage.textContent = getPieceSymbol(piece);
      document.body.appendChild(dragImage);
      e.dataTransfer.setDragImage(dragImage, 30, 30);
      setTimeout(() => { if (document.body.contains(dragImage)) document.body.removeChild(dragImage); }, 0);
    } else {
      e.preventDefault();
    }
  }, [board, disabled, fen]);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); }, []);
  const handleDragEnd = useCallback(() => { setDraggedPiece(null); setSelectedSquare(null); setPossibleMoves([]); }, []);
  
  const handleDrop = useCallback((e: React.DragEvent, rank: number, file: number) => {
    e.preventDefault();
    if (!draggedPiece || disabled) return;
    const fromSquare = draggedPiece.square;
    const targetSquare = indicesToSquare(rank, file);
    if (possibleMoves.includes(targetSquare)) {
        onMove?.(fromSquare, targetSquare);
    } else {
        toast({ title: "Illegal Move", description: "That move is not permitted by the rules of chess.", variant: "destructive" });
    }
    setDraggedPiece(null); setSelectedSquare(null); setPossibleMoves([]);
  }, [draggedPiece, onMove, disabled, fen, toast, possibleMoves]);

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

            // --- THIS IS THE NEW LOGIC ---
            // A move is a capture if it's a possible move AND there's a piece on the target square.
            const isCapture = isPossibleMove && piece;

            return (
              <div
                key={square}
                className={cn("chess-square aspect-square flex items-center justify-center relative cursor-pointer", isLight ? "bg-stone-200" : "bg-amber-600", isSelected && "ring-4 ring-blue-500 ring-inset", isHighlighted && "bg-green-500/50", !disabled && "hover:ring-2 hover:ring-blue-400")}
                onClick={() => handleSquareClick(actualRank, actualFile)} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, actualRank, actualFile)}>
                
                {/* Indicator for a possible move to an EMPTY square */}
                {isPossibleMove && !piece && <div className="w-1/3 h-1/3 bg-gray-900/20 rounded-full"></div>}

                {/* --- NEW CAPTURE INDICATOR --- */}
                {/* Renders a grey ring around the piece that can be captured */}
                {isCapture && (
                  <div className="absolute w-[90%] h-[90%] border-4 border-gray-500/50 rounded-full"></div>
                )}
                
                {piece && (
                  <span
                    draggable={!disabled}
                    onDragStart={(e) => handleDragStart(e, actualRank, actualFile)}
                    onDragEnd={handleDragEnd}
                    className={cn("chess-piece text-5xl leading-none select-none relative z-10", piece.color === 'white' ? "text-white" : "text-black", !disabled && "cursor-grab", draggedPiece?.square === square && "opacity-50")}
                    style={{ textShadow: piece.color === 'white' ? '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' : 'none' }}
                  >
                    {getPieceSymbol(piece)}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
      {arrows.length > 0 && (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <svg width="100%" height="100%" viewBox="0 0 8 8" style={{ transform: flipped ? 'rotate(180deg)' : 'none' }}>
            <defs> {arrows.map((arrow, index) => ( <marker key={index} id={`arrowhead-${index}`} markerWidth="2" markerHeight="2.5" refX="1.5" refY="1.25" orient="auto"><polygon points="0 0, 2 1.25, 0 2.5" fill={arrow.color || '#ef4444'} /></marker> ))} </defs>
            {arrows.map((arrow, index) => {
              const fromIndices = squareToIndices(arrow.from); const toIndices = squareToIndices(arrow.to);
              const fromX = fromIndices[1] + 0.5; const fromY = 7 - fromIndices[0] + 0.5;
              const toX = toIndices[1] + 0.5; const toY = 7 - fromIndices[0] + 0.5;
              return <line key={index} x1={fromX} y1={fromY} x2={toX} y2={toY} stroke={arrow.color || '#ef4444'} strokeWidth="0.2" markerEnd={`url(#arrowhead-${index})`} />;
            })}
          </svg>
        </div>
      )}
    </div>
  );
}
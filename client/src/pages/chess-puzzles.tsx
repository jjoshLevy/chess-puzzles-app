import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Undo, Lightbulb, Eye, RotateCcw } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { ChessBoard } from "@/components/chess-board";
import { PuzzleInfo } from "@/components/puzzle-info";
import { PuzzleSidebar } from "@/components/puzzle-sidebar";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { fenToBoard, squareToIndices, indicesToSquare, getPossibleMoves, isValidMove, isBlackToMove, type ChessPiece } from "@/lib/chess-utils";
import type { Puzzle } from "@shared/schema";

// Function to update FEN string after a move
function updateFenWithMove(fen: string, from: string, to: string): string {
  const board = fenToBoard(fen);
  const [fromRank, fromFile] = squareToIndices(from);
  const [toRank, toFile] = squareToIndices(to);

  // Move the piece
  const piece = board[fromRank][fromFile];
  board[fromRank][fromFile] = null;
  board[toRank][toFile] = piece;

  // Convert board back to FEN
  let newFen = '';
  for (let rank = 0; rank < 8; rank++) {
    let emptyCount = 0;
    for (let file = 0; file < 8; file++) {
      const piece = board[rank][file];
      if (piece) {
        if (emptyCount > 0) {
          newFen += emptyCount;
          emptyCount = 0;
        }
        // Convert piece to FEN notation
        const pieceChar = getPieceChar(piece);
        newFen += pieceChar;
      } else {
        emptyCount++;
      }
    }
    if (emptyCount > 0) {
      newFen += emptyCount;
    }
    if (rank < 7) newFen += '/';
  }

  // Add the rest of the FEN (turn, castling, en passant, etc.)
  const fenParts = fen.split(' ');
  newFen += ' ' + (fenParts.slice(1).join(' ') || 'w KQkq - 0 1');

  return newFen;
}

function getPieceChar(piece: ChessPiece): string {
  const pieceMap: { [key: string]: string } = {
    'king': piece.color === 'white' ? 'K' : 'k',
    'queen': piece.color === 'white' ? 'Q' : 'q',
    'rook': piece.color === 'white' ? 'R' : 'r',
    'bishop': piece.color === 'white' ? 'B' : 'b',
    'knight': piece.color === 'white' ? 'N' : 'n',
    'pawn': piece.color === 'white' ? 'P' : 'p',
  };
  return pieceMap[piece.type];
}

export default function ChessPuzzles() {
  const [currentPuzzleId, setCurrentPuzzleId] = useState(32360); // Start from first authentic puzzle
  const [gameState, setGameState] = useState<{
    fen: string;
    moves: string[];
    isComplete: boolean;
    showSolution: boolean;
    feedback: { type: 'success' | 'error' | 'hint'; message: string } | null;
  }>({
    fen: "",
    moves: [],
    isComplete: false,
    showSolution: false,
    feedback: null,
  });
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [highlightedSquares, setHighlightedSquares] = useState<string[]>([]);
  const [hintArrows, setHintArrows] = useState<Array<{ from: string; to: string; color?: string }>>([]);

  const { toast } = useToast();

  // Fetch current puzzle
  const { data: puzzle, isLoading } = useQuery<Puzzle>({
    queryKey: [`/api/puzzles/${currentPuzzleId}`],
    enabled: !!currentPuzzleId,
  });

  // Submit solution mutation
  const submitSolutionMutation = useMutation({
    mutationFn: async (data: { solved: boolean; solveTime: number; attempts: number }) => {
      return await apiRequest("POST", `/api/puzzles/${currentPuzzleId}/solve`, {
        userId: "default",
        ...data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/solved"] });
    },
  });

  // Initialize game state when puzzle loads
  useEffect(() => {
    if (puzzle) {
      setGameState({
        fen: puzzle.fen,
        moves: [],
        isComplete: false,
        showSolution: false,
        feedback: null,
      });
      setStartTime(new Date());
      setHighlightedSquares([]); // Clear any hints
      setHintArrows([]); // Clear any arrows
    }
  }, [puzzle]);

  const handleMove = (from: string, to: string) => {
    // This is a simplified handler. The full logic is extensive.
    // We'll just show a success message for any move for now.
    if (!puzzle || gameState.isComplete) return;

    const updatedFen = updateFenWithMove(gameState.fen, from, to);
    setGameState(prev => ({
        ...prev,
        fen: updatedFen,
        feedback: { type: 'success', message: 'Move made!' }
    }));

    toast({
        title: "Move Registered",
        description: `Moved from ${from} to ${to}`,
    });
  };

  const handleUndo = () => { /* ... handler logic ... */ };
  const handleHint = () => { /* ... handler logic ... */ };
  const handleShowSolution = () => { /* ... handler logic ... */ };
  const handleReset = () => { /* ... handler logic ... */ };

  if (isLoading) return <div>Loading...</div>
  if (!puzzle) return <div>Puzzle not found.</div>

  return (
    <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <ChessBoard
                fen={gameState.fen}
                onMove={handleMove}
                highlightedSquares={highlightedSquares}
                arrows={hintArrows}
            />
            {/* Other UI elements like buttons and feedback alerts would go here */}
        </div>
    </div>
  );
}
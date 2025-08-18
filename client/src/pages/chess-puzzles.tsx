import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, ArrowRight, Lightbulb, Eye, RotateCcw, Undo } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { ChessBoard } from "@/components/chess-board";
import { BoardWrapper } from "@/components/BoardWrapper";
import { PuzzleInfo } from "@/components/puzzle-info";
import { PuzzleSidebar, type Filters } from "@/components/puzzle-sidebar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { fenToBoard, squareToIndices, isBlackToMove, getPossibleMoves, type ChessPiece, indicesToSquare, getPieceSymbol, isLightSquare } from "@/lib/chess-utils";
import { cn } from "@/lib/utils";
import type { Puzzle as PuzzleSchema } from "@shared/schema";

interface Puzzle {
  id: number;
  PuzzleId: string;
  FEN: string;
  Moves: string;
  Rating: number;
  Themes: string;
  puzzleId?: string;
  rating?: number;
  themes?: string;
}

function updateFenWithMove(fen: string, from: string, to: string): string {
  const board = fenToBoard(fen);
  const [fromRank, fromFile] = squareToIndices(from);
  const [toRank, toFile] = squareToIndices(to);
  const piece = board[fromRank][fromFile];
  board[fromRank][fromFile] = null;
  board[toRank][toFile] = piece;
  let newFen = '';
  for (let rank = 0; rank < 8; rank++) {
    let emptyCount = 0;
    for (let file = 0; file < 8; file++) {
      const piece = board[rank][file];
      if (piece) {
        if (emptyCount > 0) { newFen += emptyCount; emptyCount = 0; }
        newFen += getPieceChar(piece);
      } else { emptyCount++; }
    }
    if (emptyCount > 0) { newFen += emptyCount; }
    if (rank < 7) newFen += '/';
  }
  const fenParts = fen.split(' ');
  newFen += ' ' + (fenParts[1] === 'w' ? 'b' : 'w') + ' ' + fenParts.slice(2).join(' ');
  return newFen;
}

function getPieceChar(piece: ChessPiece): string {
  const pieceMap: { [key: string]: string } = {
    'king': piece.color === 'white' ? 'K' : 'k', 'queen': piece.color === 'white' ? 'Q' : 'q',
    'rook': piece.color === 'white' ? 'R' : 'r', 'bishop': piece.color === 'white' ? 'B' : 'b',
    'knight': piece.color === 'white' ? 'N' : 'n', 'pawn': piece.color === 'white' ? 'P' : 'p',
  };
  return pieceMap[piece.type];
}

export default function ChessPuzzles() {
  const [gameState, setGameState] = useState<{
    fen: string; moves: string[]; isComplete: boolean; showSolution: boolean;
    feedback: { type: 'success' | 'error' | 'hint'; message: string } | null;
  }>({ fen: "", moves: [], isComplete: false, showSolution: false, feedback: null });
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [highlightedSquares, setHighlightedSquares] = useState<string[]>([]);
  const [hintArrows, setHintArrows] = useState<Array<{ from: string; to: string; color?: string }>>([]);
  const [isAtStartPosition, setIsAtStartPosition] = useState(false);
  const [lastMoveWasIncorrect, setLastMoveWasIncorrect] = useState(false);
  const [filters, setFilters] = useState<Filters>({ difficulties: [], themes: [] });
  const [puzzleCounter, setPuzzleCounter] = useState(1);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: puzzle, isLoading, isError } = useQuery<Puzzle>({
    queryKey: ['puzzle', filters, puzzleCounter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.difficulties.length > 0) { params.append('difficulties', filters.difficulties.join(',')); }
      if (filters.themes.length > 0) { params.append('themes', filters.themes.join(',')); }
      const response = await fetch(`/api/puzzles?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch puzzle');
      }
      return response.json();
    },
    refetchOnWindowFocus: false, retry: false
  });

  const submitSolutionMutation = useMutation({
    mutationFn: async (data: { solved: boolean; solveTime: number; attempts: number }) => {
      if (!puzzle) return;
      return await apiRequest("POST", `/api/puzzles/${puzzle.PuzzleId}/solve`, { userId: "default", ...data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });
  
  const startPuzzle = (currentPuzzle: Puzzle) => {
    if (!currentPuzzle) return;
    setIsAtStartPosition(false);
    setLastMoveWasIncorrect(false);
    setGameState({ fen: currentPuzzle.FEN, moves: [], isComplete: false, showSolution: false, feedback: { type: 'hint', message: "Opponent is thinking..." } });
    setHighlightedSquares([]); setHintArrows([]); setStartTime(null);
    const solutionMoves = (currentPuzzle.Moves || '').split(' ');
    const opponentFirstMove = solutionMoves[0];
    if (!opponentFirstMove) return;
    const opponentFrom = opponentFirstMove.substring(0, 2);
    const opponentTo = opponentFirstMove.substring(2, 4);
    setTimeout(() => {
        const puzzleStartFen = updateFenWithMove(currentPuzzle.FEN, opponentFrom, opponentTo);
        setGameState({ fen: puzzleStartFen, moves: [opponentFirstMove], isComplete: false, showSolution: false, feedback: { type: 'hint', message: 'Your turn to move!' } });
        setHighlightedSquares([opponentFrom, opponentTo]);
        setStartTime(new Date());
    }, 1000);
  };

  useEffect(() => {
    startPuzzle(puzzle as Puzzle);
  }, [puzzle]);
  
  const handleMove = (from: string, to: string) => {
    if (!puzzle || !puzzle.Moves || gameState.isComplete) return;
    setIsAtStartPosition(false);
    setHighlightedSquares([]);
    setHintArrows([]);
    const solutionMoves = puzzle.Moves.split(' ');
    const currentMoveIndex = gameState.moves.length;
    const expectedMove = solutionMoves[currentMoveIndex];
    if (!expectedMove) return;
    const expectedFrom = expectedMove.substring(0, 2);
    const expectedTo = expectedMove.substring(2, 4);
    if (from === expectedFrom && to === expectedTo) {
        setLastMoveWasIncorrect(false);
        const playerFen = updateFenWithMove(gameState.fen, from, to);
        const playerMoves = [...gameState.moves, `${from}${to}`];
        setGameState(prev => ({ ...prev, fen: playerFen, moves: playerMoves, feedback: { type: 'success', message: '✅ Correct!' } }));
        const opponentReplyIndex = currentMoveIndex + 1;
        if (opponentReplyIndex < solutionMoves.length) {
            setTimeout(() => {
                const opponentMove = solutionMoves[opponentReplyIndex];
                const opponentFrom = opponentMove.substring(0, 2);
                const opponentTo = opponentMove.substring(2, 4);
                const finalFen = updateFenWithMove(playerFen, opponentFrom, opponentTo);
                const finalMoves = [...playerMoves, `${opponentFrom}${opponentTo}`];
                setGameState(prev => ({ ...prev, fen: finalFen, moves: finalMoves, feedback: { type: 'success', message: 'Your turn!' } }));
                setHighlightedSquares([opponentFrom, opponentTo]);
            }, 500);
        } else {
            setGameState(prev => ({ ...prev, isComplete: true, feedback: { type: 'success', message: `🎉 Puzzle solved!` } }));
            const solveTime = startTime ? Math.floor((Date.now() - startTime.getTime()) / 1000) : 0;
            submitSolutionMutation.mutate({ solved: true, solveTime, attempts: 1 });
            toast({ title: "Puzzle Solved!", description: "Great job!" });
        }
    } else {
        setLastMoveWasIncorrect(true);
        const newFen = updateFenWithMove(gameState.fen, from, to);
        const newMoves = [...gameState.moves, `${from}${to}`];
        setGameState(prev => ({ ...prev, fen: newFen, moves: newMoves, isComplete: false, feedback: { type: 'error', message: '❌ Incorrect. Press Undo to try again.' } }));
        toast({ title: "Incorrect Move", description: "That's not the solution. Use the Undo button.", variant: "destructive" });
    }
  };

  const handleBack = () => {
    if (!puzzle) return;
    setLastMoveWasIncorrect(false);
    if (gameState.moves.length === 1) {
        setGameState({ ...gameState, fen: puzzle.FEN, moves: [], isComplete: false, feedback: { type: 'hint', message: 'Press Forward to see the first move.' } });
        setHighlightedSquares([]);
        setIsAtStartPosition(true);
        toast({ title: "Back to Start" });
        return;
    }
    const lastMoveWasPlayer = gameState.moves.length % 2 === 0;
    const movesToUndo = lastMoveWasPlayer ? 1 : 2;
    const newMoves = gameState.moves.slice(0, gameState.moves.length - movesToUndo);
    let boardFen = puzzle.FEN;
    for (const move of newMoves) {
        const from = move.substring(0, 2); const to = move.substring(2, 4);
        boardFen = updateFenWithMove(boardFen, from, to);
    }
    setGameState(prev => ({ ...prev, fen: boardFen, moves: newMoves, isComplete: false, feedback: { type: 'hint', message: 'Your turn to move!' } }));
    const lastOpponentMove = newMoves[newMoves.length - 1];
    if (lastOpponentMove) {
      setHighlightedSquares([lastOpponentMove.substring(0, 2), lastOpponentMove.substring(2, 4)]);
    }
    toast({ title: "Stepped Back" });
  };

  const handleForward = () => {
    if (!puzzle || !puzzle.Moves || gameState.moves.length > 0) return;
    const solutionMoves = puzzle.Moves.split(' ');
    const opponentFirstMove = solutionMoves[0];
    if (!opponentFirstMove) return;
    const opponentFrom = opponentFirstMove.substring(0, 2);
    const opponentTo = opponentFirstMove.substring(2, 4);
    const puzzleStartFen = updateFenWithMove(puzzle.FEN, opponentFrom, opponentTo);
    setGameState({ fen: puzzleStartFen, moves: [opponentFirstMove], isComplete: false, showSolution: false, feedback: { type: 'hint', message: 'Your turn to move!' } });
    setHighlightedSquares([opponentFrom, opponentTo]);
    setIsAtStartPosition(false);
  };
  
  const handleHint = () => {
    if (!puzzle || !puzzle.Moves || gameState.isComplete) return;
    const solutionMoves = puzzle.Moves.split(' ');
    const nextPlayerMove = solutionMoves[gameState.moves.length];
    if (!nextPlayerMove) return;
    const fromSquare = nextPlayerMove.substring(0, 2);
    setHighlightedSquares([fromSquare]);
    setHintArrows([]);
    toast({ title: "Hint", description: `Try moving the piece from ${fromSquare.toUpperCase()}` });
  };

  const handleShowSolution = () => {
    if (!puzzle || !puzzle.Moves || gameState.isComplete) return;
    const solutionMoves = puzzle.Moves.split(' ');
    const nextPlayerMove = solutionMoves[gameState.moves.length];
    if (!nextPlayerMove) return;
    const fromSquare = nextPlayerMove.substring(0, 2);
    const toSquare = nextPlayerMove.substring(2, 4);
    setHighlightedSquares([fromSquare, toSquare]);
    setHintArrows([]);
    toast({ title: "Solution", description: `The correct move is ${fromSquare.toUpperCase()} to ${toSquare.toUpperCase()}` });
  };

  const handleReset = () => { if (puzzle) { startPuzzle(puzzle); } };
  
  const handleNextPuzzle = () => { setPuzzleCounter(prev => prev + 1); };
  const handlePreviousPuzzle = () => { setPuzzleCounter(prev => prev > 1 ? prev - 1 : 1); };
  const handleFiltersApply = (newFilters: Filters) => { setPuzzleCounter(1); setFilters(newFilters); };

  // --- THIS IS THE FIX: The illegal comments have been replaced with the real UI ---
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading puzzle...</div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 flex items-center justify-center h-96 text-center">
              <div className="text-lg text-red-600">
                <p>Could not find a puzzle with those filters.</p>
                <p className="text-sm text-gray-500 mt-2">Try a different filter combination.</p>
              </div>
            </div>
            <div className="lg:col-span-1">
              <PuzzleSidebar onFiltersApply={handleFiltersApply} />
            </div>
          </div>
        </div>
      </div>
    );
  }
  // ---------------------------------------------------------------------------------
  
  if (!puzzle || !puzzle.FEN || !puzzle.Moves) {
    return (
        <div className="min-h-screen bg-gray-50">
            <AppHeader />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="text-lg text-red-600 text-center">
                    <p>Error: Puzzle data is incomplete.</p>
                    <p>Puzzle ID: {puzzle?.PuzzleId || 'N/A'}</p>
                </div>
            </div>
        </div>
    );
  }
  
  const puzzleInfoProps = {
      puzzleId: puzzle.PuzzleId,
      rating: puzzle.Rating,
      themes: puzzle.Themes,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <PuzzleInfo
              puzzle={puzzleInfoProps as any}
              puzzleNumber={puzzleCounter}
              onPrevious={handlePreviousPuzzle}
              onNext={handleNextPuzzle}
              onBookmark={() => toast({ title: "Bookmarked!" })}
            />
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <BoardWrapper onPrevious={handlePreviousPuzzle} onNext={handleNextPuzzle}>
                <ChessBoard
                  fen={gameState.fen}
                  onMove={handleMove}
                  disabled={gameState.isComplete}
                  flipped={puzzle ? !isBlackToMove(puzzle.FEN) : false}
                  highlightedSquares={highlightedSquares}
                  arrows={hintArrows}
                />
              </BoardWrapper>
              <div className="flex justify-center items-center space-x-4 mt-6">
                {lastMoveWasIncorrect ? ( <Button variant="outline" onClick={handleBack}><Undo className="w-4 h-4 mr-2" /> Undo</Button>
                ) : isAtStartPosition ? ( <Button variant="outline" onClick={handleForward}><ArrowRight className="w-4 h-4 mr-2" /> Forward</Button>
                ) : ( <Button variant="outline" onClick={handleBack} disabled={gameState.moves.length === 0}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button> )}
                <Button variant="outline" onClick={handleHint} disabled={gameState.isComplete}><Lightbulb className="w-4 h-4 mr-2" /> Hint</Button>
                <Button variant="outline" onClick={handleShowSolution} disabled={gameState.isComplete} className="bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500"><Eye className="w-4 h-4 mr-2" /> Solution</Button>
                <Button variant="outline" onClick={handleReset}><RotateCcw className="w-4 h-4 mr-2" /> Reset</Button>
              </div>
            </div>
            {gameState.moves.length > 0 && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Your Moves:</h3>
                <div className="text-sm text-gray-600">
                  {gameState.moves.map((move, index) => (
                    <span key={index} className="mr-2">
                      {Math.ceil((index + 1) / 2)}. {move}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-6">
              <Alert className={`${ gameState.feedback?.type === 'success' ? 'bg-green-50' : gameState.feedback?.type === 'error' ? 'bg-red-50' : 'bg-gray-50' }`}>
                <AlertDescription>{gameState.feedback?.message || `Ready to solve: Make your move!`}</AlertDescription>
              </Alert>
            </div>
          </div>
          <div className="lg:col-span-1">
            <PuzzleSidebar onFiltersApply={handleFiltersApply} />
          </div>
        </div>
      </div>
    </div>
  );
}
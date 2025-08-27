import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Lightbulb, Eye, RotateCcw, Undo } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { ChessBoard } from "@/components/chess-board";
import { BoardWrapper } from "@/components/BoardWrapper";
import { PuzzleInfo } from "@/components/puzzle-info";
import { PuzzleSidebar, type Filters } from "@/components/puzzle-sidebar";
import { apiRequest } from "@/lib/queryClient";
import { fenToBoard, squareToIndices, isBlackToMove, getPossibleMoves, type ChessPiece, indicesToSquare, getPieceSymbol, isLightSquare } from "@/lib/chess-utils";
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
  const [markers, setMarkers] = useState<Array<{ square: string; type: 'correct' | 'incorrect' }>>([]);
  const [opponentAnim, setOpponentAnim] = useState<{ from: string; to: string } | null>(null);
  const [animProgress, setAnimProgress] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [boardRect, setBoardRect] = useState<{
    top: number; left: number; width: number; height: number;
  } | null>(null);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [isAtStartPosition, setIsAtStartPosition] = useState(false);
  const [lastMoveWasIncorrect, setLastMoveWasIncorrect] = useState(false);
  const [filters, setFilters] = useState<Filters>({ difficulties: [], themes: [] });
  const [puzzleCounter, setPuzzleCounter] = useState(1);

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
        // Thinking delay already elapsed (1000ms), now animate first move
        setWaitingForOpponent(true);
        setOpponentAnim({ from: opponentFrom, to: opponentTo });
        setHighlightedSquares([opponentFrom, opponentTo]);
        setAnimProgress(false);
        setTimeout(() => setAnimProgress(true), 50);
        setTimeout(() => {
          const puzzleStartFen = updateFenWithMove(currentPuzzle.FEN, opponentFrom, opponentTo);
          setGameState({ fen: puzzleStartFen, moves: [opponentFirstMove], isComplete: false, showSolution: false, feedback: { type: 'hint', message: 'Your turn to move!' } });
          setWaitingForOpponent(false);
          setOpponentAnim(null);
          setAnimProgress(false);
          setStartTime(new Date());
        }, 900);
    }, 1000);
  };

  useEffect(() => {
    startPuzzle(puzzle as Puzzle);
  }, [puzzle]);

  // Measure the chess board position/size relative to our wrapper
  useEffect(() => {
    const measure = () => {
      if (!wrapperRef.current) return;
      const boardEl = wrapperRef.current.querySelector('.chess-board') as HTMLElement | null;
      if (!boardEl) return;
      const wrapRect = wrapperRef.current.getBoundingClientRect();
      const br = boardEl.getBoundingClientRect();
      setBoardRect({ top: br.top - wrapRect.top, left: br.left - wrapRect.left, width: br.width, height: br.height });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  useEffect(() => {
    if (!wrapperRef.current) return;
    const boardEl = wrapperRef.current.querySelector('.chess-board') as HTMLElement | null;
    if (!boardEl) return;
    const wrapRect = wrapperRef.current.getBoundingClientRect();
    const br = boardEl.getBoundingClientRect();
    setBoardRect({ top: br.top - wrapRect.top, left: br.left - wrapRect.left, width: br.width, height: br.height });
  }, [gameState.fen, opponentAnim, isAtStartPosition]);
  
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
        // Animate player's move first, then apply
        setOpponentAnim({ from, to });
        setAnimProgress(false);
        setTimeout(() => setAnimProgress(true), 50);
        // Show correct marker at the moment the animation ends
        setTimeout(() => { setMarkers([{ square: to, type: 'correct' }]); }, 800);
        setTimeout(() => setMarkers([]), 1400);
        setTimeout(() => {
            const playerFen = updateFenWithMove(gameState.fen, from, to);
            const playerMoves = [...gameState.moves, `${from}${to}`];
            setGameState(prev => ({ ...prev, fen: playerFen, moves: playerMoves }));
            // Clear player animation overlay before opponent begins thinking
            setOpponentAnim(null);
            setAnimProgress(false);
            const opponentReplyIndex = currentMoveIndex + 1;
        if (opponentReplyIndex < solutionMoves.length) {
            const opponentMove = solutionMoves[opponentReplyIndex];
            const opponentFrom = opponentMove.substring(0, 2);
            const opponentTo = opponentMove.substring(2, 4);
            // Add a short thinking delay before the opponent moves
            setWaitingForOpponent(true);
            setTimeout(() => {
              // Trigger animated move for the opponent piece before applying it to the FEN
              setOpponentAnim({ from: opponentFrom, to: opponentTo });
              setHighlightedSquares([opponentFrom, opponentTo]);
              setAnimProgress(false);
              // Kick off the CSS transition on the next tick
              setTimeout(() => setAnimProgress(true), 50);
              // After the animation duration, apply the move and clear animation state
              setTimeout(() => {
              const finalFen = updateFenWithMove(playerFen, opponentFrom, opponentTo);
              const finalMoves = [...playerMoves, `${opponentFrom}${opponentTo}`];
              setGameState(prev => ({ ...prev, fen: finalFen, moves: finalMoves, feedback: { type: 'success', message: 'Your turn!' } }));
              // Small delay to ensure the board renders before removing overlay to avoid flicker
              setTimeout(() => {
              setOpponentAnim(null);
              setAnimProgress(false);
              setWaitingForOpponent(false);
              }, 100);
              }, 900);
            }, 200);
        } else {
            const solveTime = startTime ? Math.floor((Date.now() - startTime.getTime()) / 1000) : 0;
            submitSolutionMutation.mutate({ solved: true, solveTime, attempts: 1 });
            // Delay the solved overlay slightly so the final move is visible first
            setTimeout(() => {
              setGameState(prev => ({ ...prev, isComplete: true }));
            }, 700);
        }
        }, 1250);
    } else {
        setLastMoveWasIncorrect(true);
        // Animate player's incorrect move, then apply
        setOpponentAnim({ from, to });
        setAnimProgress(false);
        setTimeout(() => setAnimProgress(true), 50);
        // Show incorrect marker at the moment the animation ends
        setTimeout(() => { setMarkers([{ square: to, type: 'incorrect' }]); }, 800);
        setTimeout(() => setMarkers([]), 2000);
        setTimeout(() => {
          const newFen = updateFenWithMove(gameState.fen, from, to);
          const newMoves = [...gameState.moves, `${from}${to}`];
          setGameState(prev => ({ ...prev, fen: newFen, moves: newMoves, isComplete: false }));
          // Clear player animation overlay
          setOpponentAnim(null);
          setAnimProgress(false);
        }, 1250);
    }
  };

  const handleBack = () => {
    if (!puzzle) return;
    setLastMoveWasIncorrect(false);
    if (gameState.moves.length === 1) {
        setGameState({ ...gameState, fen: puzzle.FEN, moves: [], isComplete: false, feedback: { type: 'hint', message: 'Press Forward to see the first move.' } });
        setHighlightedSquares([]);
        setIsAtStartPosition(true);
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
      };

  const handleForward = () => {
    if (!puzzle || !puzzle.Moves || gameState.moves.length > 0) return;
    const solutionMoves = puzzle.Moves.split(' ');
    const opponentFirstMove = solutionMoves[0];
    if (!opponentFirstMove) return;
    const opponentFrom = opponentFirstMove.substring(0, 2);
    const opponentTo = opponentFirstMove.substring(2, 4);
    setWaitingForOpponent(true);
    setOpponentAnim({ from: opponentFrom, to: opponentTo });
    setHighlightedSquares([opponentFrom, opponentTo]);
    setAnimProgress(false);
    setTimeout(() => setAnimProgress(true), 50);
    setTimeout(() => {
      const puzzleStartFen = updateFenWithMove(puzzle.FEN, opponentFrom, opponentTo);
      setGameState({ fen: puzzleStartFen, moves: [opponentFirstMove], isComplete: false, showSolution: false, feedback: { type: 'hint', message: 'Your turn to move!' } });
      setWaitingForOpponent(false);
      setOpponentAnim(null);
      setAnimProgress(false);
    }, 900);
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
      };

  const handleReset = () => { if (puzzle) { startPuzzle(puzzle); } };
  
  const handleNextPuzzle = () => { setPuzzleCounter(prev => prev + 1); };
  const handlePreviousPuzzle = () => { setPuzzleCounter(prev => prev > 1 ? prev - 1 : 1); };
  const handleFiltersApply = (newFilters: Filters) => { setPuzzleCounter(1); setFilters(newFilters); };

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
              <PuzzleSidebar filters={filters} onFiltersApply={handleFiltersApply} />
            </div>
          </div>
        </div>
      </div>
    );
  }
  
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
              onBookmark={() => {}}
            />
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="relative" ref={wrapperRef}>
                <BoardWrapper onPrevious={handlePreviousPuzzle} onNext={handleNextPuzzle}>
                  <ChessBoard
                    fen={gameState.fen}
                    onMove={handleMove}
                    disabled={gameState.isComplete || opponentAnim !== null || waitingForOpponent}
                    flipped={puzzle ? !isBlackToMove(puzzle.FEN) : false}
                    highlightedSquares={highlightedSquares}
                    arrows={hintArrows}
                    markers={markers}
                  />
                </BoardWrapper>
                {/* Opponent move animation overlay */}
                {opponentAnim && boardRect && (() => {
                  const [fr, ff] = squareToIndices(opponentAnim.from);
                  const [tr, tf] = squareToIndices(opponentAnim.to);
                  const isFlipped = puzzle ? !isBlackToMove(puzzle.FEN) : false;
                  const cell = boardRect.width / 8;
                  const topStart = Math.round((isFlipped ? (7 - fr) : fr) * cell);
                  const leftStart = Math.round((isFlipped ? (7 - ff) : ff) * cell);
                  const topEnd = Math.round((isFlipped ? (7 - tr) : tr) * cell);
                  const leftEnd = Math.round((isFlipped ? (7 - tf) : tf) * cell);
                  const dx = leftEnd - leftStart;
                  const dy = topEnd - topStart;
                  const cellInt = Math.round(cell);
                  const boardMatrix = fenToBoard(gameState.fen);
                  const movingPiece = boardMatrix[fr][ff];
                  const fromIsLight = isLightSquare(fr, ff);
                  const toIsLight = isLightSquare(tr, tf);
                  const pieceSymbol = movingPiece ? getPieceSymbol(movingPiece) : '';
                  const pieceTextColor = movingPiece?.color === 'white' ? 'text-white' : 'text-black';
                  const pieceShadow = movingPiece?.color === 'white' ? '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' : 'none';
                  return (
                    <div
                      className="pointer-events-none absolute z-50"
                      style={{ top: boardRect.top, left: boardRect.left, width: boardRect.width, height: boardRect.height }}
                    >
                      {/* Cover the source square to hide the static piece underneath while animating */}
                      <div
                        className={`${fromIsLight ? 'bg-stone-200' : 'bg-amber-600'} absolute`}
                        style={{ top: topStart, left: leftStart, width: cellInt, height: cellInt }}
                      />
                      {/* If capturing, cover the destination square piece to avoid overlap during animation */}
                      {boardMatrix[tr][tf] && (
                        <div
                          className={`${toIsLight ? 'bg-stone-200' : 'bg-amber-600'} absolute`}
                          style={{ top: topEnd, left: leftEnd, width: cellInt, height: cellInt }}
                        />
                      )}
                      {/* Moving piece */}
                      <div
                        className="absolute flex items-center justify-center"
                        style={{
                          top: topStart,
                          left: leftStart,
                          width: cellInt,
                          height: cellInt,
                          transform: animProgress ? `translate(${dx}px, ${dy}px)` : 'translate(0px, 0px)',
                          transition: 'transform 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
                        }}
                      >
                        <span
                          className={`text-5xl leading-none select-none ${pieceTextColor}`}
                          style={{ textShadow: pieceShadow }}
                        >
                          {pieceSymbol}
                        </span>
                      </div>
                    </div>
                  );
                })()}
                {gameState.isComplete && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center">
                    {/* Dim background over the board for contrast */}
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-none"></div>
                    {/* Foreground content card */}
                    <div className="relative pointer-events-auto">
                      <div className="flex flex-col items-center gap-4 bg-white/95 rounded-xl shadow-2xl px-6 py-5 border border-gray-200">
                        <div className="w-28 h-28 rounded-full bg-green-600 text-white flex items-center justify-center shadow-lg ring-8 ring-green-500/30">
                          <span className="text-6xl">✓</span>
                        </div>
                        <div className="text-green-700 font-bold text-2xl">Puzzle Solved</div>
                        <button
                          className="mt-1 px-5 py-2.5 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                          onClick={handleNextPuzzle}
                        >
                          Next Puzzle
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-center items-center space-x-4 mt-6">
                {lastMoveWasIncorrect ? ( <Button variant="outline" onClick={handleBack}><Undo className="w-4 h-4 mr-2" /> Undo</Button>
                ) : isAtStartPosition ? ( <Button variant="outline" onClick={handleForward}><ArrowRight className="w-4 h-4 mr-2" /> Forward</Button>
                ) : ( <Button variant="outline" onClick={handleBack} disabled={gameState.moves.length === 0}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button> )}
                <Button variant="outline" onClick={handleHint} disabled={gameState.isComplete}><Lightbulb className="w-4 h-4 mr-2" /> Hint</Button>
                <Button variant="outline" onClick={handleShowSolution} disabled={gameState.isComplete} className="bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500"><Eye className="w-4 h-4 mr-2" /> Solution</Button>
                <Button variant="outline" onClick={handleReset}><RotateCcw className="w-4 h-4 mr-2" /> Reset</Button>
              </div>
            </div>
          </div>
          <div className="lg:col-span-1">
            <PuzzleSidebar filters={filters} onFiltersApply={handleFiltersApply} />
          </div>
        </div>
      </div>
    </div>
  );
}
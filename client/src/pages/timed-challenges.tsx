import { useState, useEffect, useRef } from "react";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { ChessBoard } from "@/components/chess-board";
import { BoardWrapper } from "@/components/BoardWrapper";
import { isBlackToMove, updateFenWithMove, fenToBoard, squareToIndices, getPieceSymbol, isLightSquare } from "@/lib/chess-utils";

const TIME_OPTIONS = [
  { label: "1 Minute", value: 60 },
  { label: "3 Minutes", value: 180 },
  { label: "5 Minutes", value: 300 },
];

export default function TimedChallenges() {
  const [selectedTime, setSelectedTime] = useState(60);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [puzzle, setPuzzle] = useState<any>(null);
  const [challengeFinished, setChallengeFinished] = useState(false);
  const [gameState, setGameState] = useState<{ fen: string; moves: string[]; isComplete: boolean }>({ fen: "", moves: [], isComplete: false });
  const [loadingPuzzle, setLoadingPuzzle] = useState(false);
  const [highlightedSquares, setHighlightedSquares] = useState<string[]>([]);
  const [awaitingFirstMove, setAwaitingFirstMove] = useState(false);
  const [markers, setMarkers] = useState<{ square: string; type: 'correct' | 'incorrect' }[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [boardRect, setBoardRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [opponentAnim, setOpponentAnim] = useState<{ from: string; to: string } | null>(null);
  const [animProgress, setAnimProgress] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch a random puzzle from your API
  const fetchPuzzle = async () => {
    setLoadingPuzzle(true);
    const res = await fetch("/api/puzzles");
    if (res.ok) {
      const p = await res.json();
      setPuzzle(p);
      const solutionMoves = (p.Moves || '').split(' ');
      // Start at initial FEN, then after a brief delay apply opponent's first move
      setGameState({ fen: p.FEN, moves: [], isComplete: false });
      setHighlightedSquares([]);
      if (solutionMoves.length > 0) {
        setAwaitingFirstMove(true);
        const opponentMove = solutionMoves[0];
        const from = opponentMove.substring(0, 2);
        const to = opponentMove.substring(2, 4);
        setOpponentAnim({ from, to });
        setHighlightedSquares([from, to]);
        setAnimProgress(false);
        setTimeout(() => setAnimProgress(true), 50);
        setTimeout(() => {
          const fenAfter = updateFenWithMove(p.FEN, from, to);
          setGameState({ fen: fenAfter, moves: [opponentMove], isComplete: false });
          setOpponentAnim(null);
          setAnimProgress(false);
          setAwaitingFirstMove(false);
        }, 300);
      }
    }
    setLoadingPuzzle(false);
  };

  // Start challenge: fetch puzzle first, then start timer
  const startChallenge = async () => {
    setScore(0);
    setTimeLeft(selectedTime);
    setIsRunning(false);
    setChallengeFinished(false);
    setPuzzle(null);
    setGameState({ fen: "", moves: [], isComplete: false });
    await fetchPuzzle();
    setIsRunning(true); // Start timer only after puzzle is loaded
  };

  // Timer effect
  useEffect(() => {
    if (!isRunning) return;
    if (timeLeft <= 0) {
      setIsRunning(false);
      setChallengeFinished(true);
      return;
    }
    timerRef.current = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timerRef.current!);
  }, [isRunning, timeLeft]);

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
  }, [gameState.fen, opponentAnim]);

  // Handle user move
  const handleMove = (from: string, to: string) => {
    if (!puzzle || !puzzle.Moves || gameState.isComplete) return;
    const solutionMoves = puzzle.Moves.split(' ');
    const currentMoveIndex = gameState.moves.length;
    const expectedMove = solutionMoves[currentMoveIndex];
    if (!expectedMove) return;
    const expectedFrom = expectedMove.substring(0, 2);
    const expectedTo = expectedMove.substring(2, 4);

    if (from === expectedFrom && to === expectedTo) {
      // Correct move
      const newFen = updateFenWithMove(gameState.fen, from, to);
      const newMoves = [...gameState.moves, `${from}${to}`];
      setMarkers([{ square: to, type: 'correct' }]);
      setHighlightedSquares([from, to]);
      setTimeout(() => setMarkers([]), 600);
      // If puzzle is complete (all solution moves played)
      if (newMoves.length === solutionMoves.length) {
        setGameState({ fen: newFen, moves: newMoves, isComplete: true });
        setScore((s) => s + 1);
        // Fetch next puzzle after a short delay
        setTimeout(async () => {
          await fetchPuzzle();
        }, 800);
      } else {
        // If not complete, play opponent's move automatically with animation
        setTimeout(() => {
          const opponentMove = solutionMoves[newMoves.length];
          if (opponentMove) {
            const oppFrom = opponentMove.substring(0, 2);
            const oppTo = opponentMove.substring(2, 4);
            setOpponentAnim({ from: oppFrom, to: oppTo });
            setHighlightedSquares([oppFrom, oppTo]);
            setAnimProgress(false);
            setTimeout(() => setAnimProgress(true), 50);
            setTimeout(() => {
              const fenAfterOpp = updateFenWithMove(newFen, oppFrom, oppTo);
              setGameState({ fen: fenAfterOpp, moves: [...newMoves, opponentMove], isComplete: false });
              setOpponentAnim(null);
              setAnimProgress(false);
            }, 300);
          } else {
            setGameState({ fen: newFen, moves: newMoves, isComplete: false });
          }
        }, 120);
      }
    } else {
      // Incorrect move: apply it, show marker, then fetch next puzzle
      const newFen = updateFenWithMove(gameState.fen, from, to);
      const newMoves = [...gameState.moves, `${from}${to}`];
      setGameState({ fen: newFen, moves: newMoves, isComplete: true });
      setMarkers([{ square: to, type: 'incorrect' }]);
      setHighlightedSquares([from, to]);
      setTimeout(() => setMarkers([]), 600);
      setTimeout(async () => {
        await fetchPuzzle();
      }, 800);
    }
  };

  // Handle skip (optional)
  const handleSkip = async () => {
    await fetchPuzzle();
  };

  // Reset on finish
  const handleReset = () => {
    setIsRunning(false);
    setScore(0);
    setTimeLeft(selectedTime);
    setPuzzle(null);
    setChallengeFinished(false);
    setGameState({ fen: "", moves: [], isComplete: false });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-6">Timed Challenges</h1>
        {!isRunning && !challengeFinished && (
          <div className="bg-white rounded-xl shadow p-6 space-y-6">
            <div>
              <p className="mb-2 font-semibold">Choose your challenge time:</p>
              <div className="flex space-x-4">
                {TIME_OPTIONS.map((opt) => (
                  <Button
                    key={opt.value}
                    variant={selectedTime === opt.value ? "default" : "outline"}
                    onClick={() => setSelectedTime(opt.value)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>
            <Button className="w-full mt-6" onClick={startChallenge} disabled={loadingPuzzle}>
              {loadingPuzzle ? "Loading..." : "Start Challenge"}
            </Button>
            {score > 0 && (
              <div className="mt-4 text-center">
                <p className="text-lg font-semibold">Your Score: {score}</p>
              </div>
            )}
          </div>
        )}
        {isRunning && (
          <div className="bg-white rounded-xl shadow p-6 space-y-6">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Time Left: {timeLeft}s</span>
              <span className="font-semibold">Score: {score}</span>
            </div>
            <div className="my-4">
              {loadingPuzzle || !puzzle || !gameState.fen ? (
                <div>Loading puzzle...</div>
              ) : (
                <>
                  <div className="flex justify-center mb-3">
                    <div className="px-4 py-1 rounded-full bg-gray-800 text-white font-semibold">
                      {isBlackToMove(gameState.fen) ? 'Black to move' : 'White to move'}
                    </div>
                  </div>
                  <div className="relative" ref={wrapperRef}>
                    <BoardWrapper onPrevious={handleSkip} onNext={handleSkip}>
                      <ChessBoard
                        fen={gameState.fen}
                        onMove={handleMove}
                        disabled={gameState.isComplete || awaitingFirstMove || opponentAnim !== null}
                        flipped={puzzle ? !isBlackToMove(puzzle.FEN) : false}
                        highlightedSquares={highlightedSquares}
                        markers={markers}
                      />
                    </BoardWrapper>
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
                          {/* Cover the source square */}
                          <div
                            className={`${fromIsLight ? 'bg-stone-200' : 'bg-amber-600'} absolute`}
                            style={{ top: topStart, left: leftStart, width: cellInt, height: cellInt }}
                          />
                          {/* If capturing, cover the destination square piece */}
                          {boardMatrix[tr][tf] && (
                            <div
                              className={`${toIsLight ? 'bg-stone-200' : 'bg-amber-600'} absolute`}
                              style={{ top: topEnd, left: leftEnd, width: cellInt, height: cellInt }}
                            />
                          )}
                          {/* Highlight from/to squares */}
                          <div
                            className="absolute"
                            style={{ top: topStart, left: leftStart, width: cellInt, height: cellInt, backgroundColor: 'rgba(34,197,94,0.35)' }}
                          />
                          <div
                            className="absolute"
                            style={{ top: topEnd, left: leftEnd, width: cellInt, height: cellInt, backgroundColor: 'rgba(34,197,94,0.35)' }}
                          />
                          {/* Moving piece */}
                          <div
                            className="absolute flex items-center justify-center"
                            style={{
                              top: topStart,
                              left: leftStart,
                              width: cellInt,
                              height: cellInt,
                              transform: animProgress ? `translate(${dx}px, ${dy}px)` : 'translate(0px, 0px)',
                              transition: 'transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
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
                  </div>
                </>
              )}
            </div>
            <Button className="w-full" variant="outline" onClick={handleReset}>
              End Challenge
            </Button>
            <Button className="w-full mt-2" variant="outline" onClick={handleSkip} disabled={loadingPuzzle}>
              Skip Puzzle
            </Button>
          </div>
        )}
        {challengeFinished && (
          <div className="bg-white rounded-xl shadow p-6 space-y-6 text-center">
            <h2 className="text-2xl font-bold">Challenge Complete!</h2>
            <p className="text-lg">You solved {score} puzzles in {selectedTime / 60} minute(s).</p>
            <Button className="mt-4" onClick={startChallenge}>
              Play Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
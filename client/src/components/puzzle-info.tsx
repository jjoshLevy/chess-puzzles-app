import { Button } from "@/components/ui/button";
import { Bookmark, Star } from "lucide-react";

// The shape of the puzzle object this component expects
interface Puzzle {
  puzzleId: string;
  rating: number;
  themes: string;
}

interface PuzzleInfoProps {
  puzzle: Puzzle;
  // We still accept onPrevious and onNext, even though we aren't using them in this component,
  // because the parent (chess-puzzles.tsx) is still passing them down.
  onPrevious: () => void;
  onNext: () => void;
  onBookmark: () => void;
}

// Helper function to determine the star rating
const getDifficultyStars = (rating: number) => {
  if (rating < 1200) return 1;
  if (rating < 1800) return 2;
  return 3;
};

export function PuzzleInfo({ puzzle, onBookmark }: PuzzleInfoProps) {
  const starCount = getDifficultyStars(puzzle.rating);

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* Previous and Next buttons have been removed from here */}
          <h2 className="text-2xl font-bold">Puzzle #{puzzle.puzzleId}</h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={onBookmark}>
            <Bookmark className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      <div className="mt-2 flex items-center space-x-2 text-sm text-gray-600">
        <div className="flex">
          {Array.from({ length: 3 }).map((_, index) => (
            <Star
              key={index}
              className={`h-5 w-5 ${index < starCount ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
            />
          ))}
        </div>
        <span>({puzzle.rating})</span>
      </div>
      
      <div className="mt-2 text-xs text-gray-500 capitalize">
        Themes: {puzzle.themes.replace(/_/g, ' ')}
      </div>
    </div>
  );
}
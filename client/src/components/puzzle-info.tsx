import { Button } from "@/components/ui/button";
import { Bookmark, Star } from "lucide-react";

// Define the shape of the puzzle data this component expects
interface Puzzle {
  puzzleId: string;
  rating: number;
  themes: string;
}

interface PuzzleInfoProps {
  puzzle: Puzzle;
  puzzleNumber: number;
  onBookmark: () => void;
}

const getDifficultyStars = (rating: number) => {
  if (rating < 1200) return 1;
  if (rating < 1800) return 2;
  return 3;
};

export function PuzzleInfo({ puzzle, puzzleNumber, onBookmark }: PuzzleInfoProps) {
  // --- THIS IS THE FINAL FIX ---
  // If the puzzle data has not loaded yet, we render a simple placeholder.
  // This prevents the application from crashing when it tries to read 'puzzle.rating' or 'puzzle.themes'
  // before the data has arrived from the server.
  if (!puzzle) {
    return (
      <div className="mb-4 p-4 text-center">
        <div className="text-sm text-gray-500">Loading puzzle info...</div>
      </div>
    );
  }
  // -----------------------------

  // If we get past the check above, we know 'puzzle' is a valid object.
  const starCount = getDifficultyStars(puzzle.rating);

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h2 className="text-2xl font-bold">Puzzle #{puzzleNumber}</h2>
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
        {/* We also add a safety check here in case themes is unexpectedly missing */}
        Themes: {(puzzle.themes || 'N/A').replace(/_/g, ' ')}
      </div>
    </div>
  );
}
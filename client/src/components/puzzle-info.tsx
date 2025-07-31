import { Button } from "@/components/ui/button";
import { Bookmark, Star } from "lucide-react";

interface Puzzle {
  puzzleId: string;
  rating: number;
  themes: string;
}

interface PuzzleInfoProps {
  puzzle: Puzzle;
  puzzleNumber: number;
  onPrevious: () => void;
  onNext: () => void;
  onBookmark: () => void;
}

const getDifficultyStars = (rating: number) => {
  if (rating < 1200) return 1;
  if (rating < 1800) return 2;
  return 3;
};

export function PuzzleInfo({ puzzle, puzzleNumber, onBookmark }: PuzzleInfoProps) {
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
        Themes: {puzzle.themes.replace(/_/g, ' ')}
      </div>
    </div>
  );
}
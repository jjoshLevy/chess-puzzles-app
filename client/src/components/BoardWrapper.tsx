import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface BoardWrapperProps {
  children: React.ReactNode; // This will be the <ChessBoard /> component
  onPrevious?: () => void;
  onNext?: () => void;
  showPrevious?: boolean;
  showNext?: boolean;
}

export function BoardWrapper({ children, onPrevious, onNext, showPrevious = true, showNext = true }: BoardWrapperProps) {
  return (
    // This 'relative' container is the key. It allows us to position the buttons
    // absolutely inside of it, relative to its own edges.
    <div className="relative w-full max-w-lg mx-auto">
      
      {/* The ChessBoard component will be passed in and rendered here */}
      {children}

      {/* --- The New Arrow Buttons --- */}
      
      {/* Left Arrow Button */}
      {showPrevious && onPrevious && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onPrevious}
          className={cn(
              "absolute top-1/2 -left-4 md:-left-16 transform -translate-y-1/2",
              "h-12 w-12 md:h-16 md:w-16 rounded-full", 
              "bg-gray-900/10 hover:bg-blue-500 hover:scale-110",
              "transition-all duration-200 z-10",
              "text-white hover:text-white" // Ensure text color is white
          )}
          aria-label="Previous Puzzle"
        >
          <ArrowLeft className="h-6 w-6 md:h-8 md:w-8" />
        </Button>
      )}

      {/* Right Arrow Button */}
      {showNext && onNext && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onNext}
          className={cn(
              "absolute top-1/2 -right-4 md:-right-16 transform -translate-y-1/2",
              "h-12 w-12 md:h-16 md:w-16 rounded-full",
              "bg-gray-900/10 hover:bg-blue-500 hover:scale-110",
              "transition-all duration-200 z-10",
              "text-white hover:text-white" // Ensure text color is white
          )}
          aria-label="Next Puzzle"
        >
          <ArrowRight className="h-6 w-6 md:h-8 md:w-8" />
        </Button>
      )}
    </div>
  );
}
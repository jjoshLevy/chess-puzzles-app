import { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Star, TrendingUp } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

// --- USER RATING COMPONENT IS NOW INSIDE THIS FILE ---
const fetchUserRating = async () => {
    const response = await fetch('/api/user/rating');
    if (!response.ok) {
        throw new Error('Failed to fetch user rating');
    }
    return response.json();
};

function UserRating() {
  const { data, isLoading, isError } = useQuery<{ rating: number }>({
    queryKey: ['user-rating'],
    queryFn: fetchUserRating,
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Your Puzzle Rating</CardTitle>
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading && <div className="text-2xl font-bold">...</div>}
        {isError && <div className="text-sm text-red-500">Error</div>}
        {data && <div className="text-2xl font-bold">{data.rating}</div>}
        <p className="text-xs text-muted-foreground">Based on puzzles solved</p>
      </CardContent>
    </Card>
  );
}
// ----------------------------------------------------

export type Difficulty = 'easy' | 'medium' | 'hard';
export interface Filters {
  difficulties: Difficulty[];
  themes: string[];
}
interface PuzzleSidebarProps { onFiltersApply: (filters: Filters) => void; }
const commonThemes = [
  'mateIn1', 'mateIn2', 'crushing', 'advantage', 'endgame',
  'opening', 'fork', 'pin', 'skewer', 'sacrifice'
];
const difficultyRatingMap = {
    easy: { min: 400, max: 1200 },
    medium: { min: 1201, max: 1800 },
    hard: { min: 1801, max: 3000 },
};

export function PuzzleSidebar({ onFiltersApply }: PuzzleSidebarProps) {
  const [selectedDifficulties, setSelectedDifficulties] = useState<Difficulty[]>([]);
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);

  const isAnyDifficulty = selectedDifficulties.length === 0;
  const isAnyTheme = selectedThemes.length === 0;

  const handleDifficultyChange = (newDifficulties: Difficulty[]) => {
    setSelectedDifficulties(newDifficulties);
  };
  
  const handleAnyDifficultyClick = () => {
    if (selectedDifficulties.length > 0) {
      setSelectedDifficulties([]);
    }
  };

  const handleThemeChange = (theme: string, checked: boolean) => {
    if (checked) {
      setSelectedThemes(prev => [...prev, theme]);
    } else {
      setSelectedThemes(prev => prev.filter(t => t !== theme));
    }
  };
  
  const handleAnyThemeClick = () => {
    if (selectedThemes.length > 0) {
      setSelectedThemes([]);
    }
  };

  const handleApply = () => {
    onFiltersApply({
      difficulties: selectedDifficulties,
      themes: selectedThemes,
    });
  };

  const getRatingDisplay = () => {
    if (isAnyDifficulty || selectedDifficulties.length === 0) { return "Any"; }
    const minRating = Math.min(...selectedDifficulties.map(d => difficultyRatingMap[d].min));
    const maxRating = Math.max(...selectedDifficulties.map(d => difficultyRatingMap[d].max));
    return `${minRating} - ${maxRating}`;
  };

  return (
    <div className="space-y-4">
      <UserRating />

      <Card>
        <CardContent className="pt-0">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1" className="border-b-0">
              <AccordionTrigger className={cn("text-lg font-semibold", "[&[data-state=closed]]:border-b-0")}>
                Filters
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-6 pt-4">
                  <div className="space-y-3">
                    <Label className="font-semibold">Difficulty</Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="any-difficulty" checked={isAnyDifficulty} onCheckedChange={handleAnyDifficultyClick} />
                      <Label htmlFor="any-difficulty">Any Difficulty</Label>
                    </div>
                    <ToggleGroup type="multiple" variant="outline" value={selectedDifficulties} onValueChange={handleDifficultyChange} className="grid grid-cols-3">
                      <ToggleGroupItem value="easy" aria-label="Easy"><Star className="h-4 w-4" /></ToggleGroupItem>
                      <ToggleGroupItem value="medium" aria-label="Medium"><Star className="h-4 w-4" /><Star className="h-4 w-4" /></ToggleGroupItem>
                      <ToggleGroupItem value="hard" aria-label="Hard"><Star className="h-4 w-4" /><Star className="h-4 w-4" /><Star className="h-4 w-4" /></ToggleGroupItem>
                    </ToggleGroup>
                    <div className="p-2 bg-gray-100 rounded-md text-center">
                      <p className="text-sm font-medium text-gray-700">Rating: {getRatingDisplay()}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="font-semibold">Themes</Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="any-theme" checked={isAnyTheme} onCheckedChange={handleAnyThemeClick} />
                      <Label htmlFor="any-theme">Any Theme</Label>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {commonThemes.map((theme) => (
                        <div key={theme} className="flex items-center space-x-2">
                          <Checkbox id={theme} checked={selectedThemes.includes(theme)} onCheckedChange={(checked) => handleThemeChange(theme, Boolean(checked))} />
                          <Label htmlFor={theme} className="capitalize text-sm">{theme.replace(/([A-Z])/g, ' $1').trim()}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button onClick={handleApply} className="w-full">Apply Filters & Find Puzzle</Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

// This function fetches the rating from our new API endpoint
const fetchUserRating = async () => {
    const response = await fetch('/api/user/rating');
    if (!response.ok) {
        throw new Error('Failed to fetch user rating');
    }
    return response.json();
};

export function UserRating() {
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
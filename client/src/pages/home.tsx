import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { Puzzle, Trophy, TrendingUp, LogOut } from "lucide-react";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              Welcome back, {user?.firstName || 'Chess Player'}!
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Ready to solve some chess puzzles?
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/api/logout'}
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Puzzles Solved</CardTitle>
              <Puzzle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Start solving to see your progress
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Rating</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1200</div>
              <p className="text-xs text-muted-foreground">
                Solve puzzles to increase your rating
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0%</div>
              <p className="text-xs text-muted-foreground">
                Your solving accuracy
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Start Training</CardTitle>
              <CardDescription>
                Begin solving chess puzzles to improve your tactical skills
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/puzzles">
                <Button className="w-full">
                  <Puzzle className="w-4 h-4 mr-2" />
                  Solve Puzzles
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Import More Puzzles</CardTitle>
              <CardDescription>
                Add more puzzle collections to expand your training
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/import">
                <Button variant="outline" className="w-full">
                  Import Puzzles
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            You have access to <strong>32,083 authentic chess puzzles</strong> to train with
          </p>
        </div>
      </div>
    </div>
  );
}
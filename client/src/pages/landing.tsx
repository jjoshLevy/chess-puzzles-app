import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Users, Trophy, Target } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Master Chess Tactics
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto">
            Train with over 32,000 authentic chess puzzles. Track your progress, improve your rating, and become a tactical master.
          </p>
          <div className="space-x-4">
            <Button 
              size="lg" 
              onClick={() => window.location.href = '/api/login'}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
            >
              Sign In to Get Started
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
              <Target className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>32,000+ Puzzles</CardTitle>
              <CardDescription>
                Train with authentic chess positions from real games
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Trophy className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <CardTitle>Track Progress</CardTitle>
              <CardDescription>
                Monitor your rating, accuracy, and solving streaks
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <CardTitle>Multiple Sign-In Options</CardTitle>
              <CardDescription>
                Sign in with Google or create a username/password account
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-8">
          <h2 className="text-3xl font-bold text-center mb-8">Features</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-6 h-6 text-green-600 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Interactive Chess Board</h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Drag and drop pieces with visual feedback and move validation
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-6 h-6 text-green-600 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Difficulty Filtering</h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Choose puzzles from beginner to advanced levels
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-6 h-6 text-green-600 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Tactical Themes</h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Focus on specific patterns like pins, forks, and skewers
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-6 h-6 text-green-600 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Progress Analytics</h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Detailed statistics on your solving performance
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
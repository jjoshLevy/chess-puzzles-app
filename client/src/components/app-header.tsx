import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

export function AppHeader() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl">♔</span>
              <h1 className="text-xl font-bold text-gray-900">ChessMaster</h1>
            </Link>
            <span className="text-sm text-gray-500 hidden sm:block">
              1 Billion Chess Puzzles
            </span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className="text-gray-700 hover:text-primary transition-colors"
            >
              Puzzles
            </Link>
            <Link
              href="/import"
              className="text-gray-700 hover:text-primary transition-colors"
            >
              Import
            </Link>
            <Link
              href="/statistics"
              className="text-gray-700 hover:text-primary transition-colors"
            >
              Statistics
            </Link>
            <Link
              href="/leaderboard"
              className="text-gray-700 hover:text-primary transition-colors"
            >
              Leaderboard
            </Link>
            <Button className="bg-primary text-white hover:bg-blue-600">
              <User className="w-4 h-4 mr-2" />
              Profile
            </Button>
          </nav>

          <button className="md:hidden p-2 text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}

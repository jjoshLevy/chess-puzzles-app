import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ChessPuzzles from "@/pages/chess-puzzles";
import ImportPage from "@/pages/import";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import { useAuth } from "@/hooks/useAuth";

function Router() {
  // Authentication temporarily disabled for testing
  // const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Authentication routing - temporarily commented out
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/puzzles" component={ChessPuzzles} />
          <Route path="/import" component={ImportPage} />
        </>
      )}
      */}
      
      {/* Direct access for testing */}
      <Route path="/" component={ChessPuzzles} />
      <Route path="/puzzles" component={ChessPuzzles} />
      <Route path="/import" component={ImportPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;


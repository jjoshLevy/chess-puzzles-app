import { Route, Switch } from "wouter";
import ChessPuzzlesPage from "./pages/chess-puzzles";
import Statistics from "./pages/statistics";
import Leaderboard from "./pages/leaderboard";

export default function App() {
  return (
    <Switch>
      <Route path="/" component={ChessPuzzlesPage} />
      <Route path="/statistics" component={Statistics} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route>
        <div className="min-h-screen flex items-center justify-center text-2xl">
          404 - Page Not Found
        </div>
      </Route>
    </Switch>
  );
}
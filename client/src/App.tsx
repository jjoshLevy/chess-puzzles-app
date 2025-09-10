import { Route, Switch } from "wouter";
import ChessPuzzlesPage from "./pages/chess-puzzles";
import Statistics from "./pages/statistics";
import Leaderboard from "./pages/leaderboard";
import TimedChallenges from "./pages/timed-challenges";
import Login from "./pages/login";
import Register from "./pages/register";

export default function App() {
  return (
    <Switch>
      <Route path="/" component={ChessPuzzlesPage} />
      <Route path="/statistics" component={Statistics} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/timed-challenges" component={TimedChallenges} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route>
        <div className="min-h-screen flex items-center justify-center text-2xl">
          404 - Page Not Found
        </div>
      </Route>
    </Switch>
  );
}
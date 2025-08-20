import { AppHeader } from "@/components/app-header";

export default function Leaderboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-6">Leaderboard</h1>
        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-lg text-gray-700">Leaderboard coming soon!</p>
        </div>
      </div>
    </div>
  );
}
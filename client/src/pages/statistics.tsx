import { AppHeader } from "@/components/app-header";
import { useEffect, useState } from "react";

interface StatsResponse {
  rating: number;
  totalSolved: number;
  averageSolveTime: number | null;
  solvesByHour: Array<{ hour: number; count: number }>;
  mostActiveHour: { hour: number; count: number };
  bestTheme: { theme: string; count: number } | null;
  topThemes: Array<{ theme: string; count: number }>;
}

export default function Statistics() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load stats');
        const data: StatsResponse = await res.json();
        if (!cancelled) setStats(data);
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Failed to load stats');
      }
    };
    fetchStats();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-6">Your Statistics</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {!stats ? (
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-lg text-gray-700">Loading statistics...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow p-4 border border-gray-200">
                <div className="text-sm text-gray-500">Puzzle Rating</div>
                <div className="text-3xl font-bold mt-1">{stats.rating}</div>
              </div>
              <div className="bg-white rounded-xl shadow p-4 border border-gray-200">
                <div className="text-sm text-gray-500">Total Solved</div>
                <div className="text-3xl font-bold mt-1">{stats.totalSolved}</div>
              </div>
              <div className="bg-white rounded-xl shadow p-4 border border-gray-200">
                <div className="text-sm text-gray-500">Avg Solve Time</div>
                <div className="text-3xl font-bold mt-1">{stats.averageSolveTime !== null ? `${stats.averageSolveTime}s` : '—'}</div>
              </div>
              <div className="bg-white rounded-xl shadow p-4 border border-gray-200">
                <div className="text-sm text-gray-500">Most Active Hour</div>
                <div className="text-3xl font-bold mt-1">{stats.mostActiveHour?.hour}:00</div>
                <div className="text-xs text-gray-500">{stats.mostActiveHour?.count} solves</div>
              </div>
            </div>

            {/* Best theme */}
            <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
              <div className="text-lg font-semibold mb-2">Best Theme</div>
              {stats.bestTheme ? (
                <div className="flex items-center justify-between">
                  <div className="text-xl">{stats.bestTheme.theme.replace(/_/g, ' ')}</div>
                  <div className="text-gray-500">{stats.bestTheme.count} solves</div>
                </div>
              ) : (
                <div className="text-gray-600">No theme data yet.</div>
              )}
              {stats.topThemes && stats.topThemes.length > 0 && (
                <ul className="mt-4 space-y-1 text-sm text-gray-700">
                  {stats.topThemes.map((t) => (
                    <li key={t.theme} className="flex items-center justify-between">
                      <span>{t.theme.replace(/_/g, ' ')}</span>
                      <span className="text-gray-500">{t.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Solves by hour bar chart */}
            <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
              <div className="text-lg font-semibold mb-4">Solves by Hour of Day</div>
              <div className="grid grid-cols-24 gap-1 items-end" style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}>
                {stats.solvesByHour.map(({ hour, count }) => {
                  const max = Math.max(1, ...stats.solvesByHour.map(h => h.count));
                  const height = Math.round((count / max) * 120); // up to 120px
                  return (
                    <div key={hour} className="flex flex-col items-center">
                      <div className="w-full bg-blue-500 rounded" style={{ height }} title={`${hour}:00 - ${count} solves`} />
                      <div className="text-[10px] text-gray-500 mt-1">{hour}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
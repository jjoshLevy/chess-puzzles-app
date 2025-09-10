import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { useLocation, Link } from "wouter";
import { queryClient } from "@/lib/queryClient";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [, navigate] = useLocation();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Login failed");
      }
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/user/rating"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      navigate("/");
    } catch (e: any) {
      setError(e.message || "Login failed");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <div className="max-w-md mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-6">Log In</h1>
        <form onSubmit={onSubmit} className="bg-white rounded-xl shadow p-6 space-y-4 border border-gray-200">
          {error && <div className="p-2 bg-red-50 text-red-700 rounded border border-red-200 text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <input className="w-full border rounded px-3 py-2" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Your username" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input className="w-full border rounded px-3 py-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" />
          </div>
          <button disabled={pending} className="w-full bg-blue-600 text-white rounded py-2 hover:bg-blue-700 disabled:opacity-50">
            {pending ? "Signing in..." : "Sign In"}
          </button>
          <div className="text-sm text-gray-600 text-center">
            Don’t have an account? <Link href="/register" className="text-blue-600 hover:underline">Create one</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

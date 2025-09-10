import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user: user as { id: string; username: string } | null,
    isLoading,
    isAuthenticated: !!user,
  };
}
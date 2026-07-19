import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Business as BusinessRow, User as UserRow } from "@shared/schema";

// These were previously hand-written copies of the DB row shapes and had drifted
// out of sync with shared/schema.ts (missing booking, payment, deposit and
// WhatsApp usage fields that /api/auth/me has been returning all along).
// Derive them from the schema instead so they can't drift again.
type User = UserRow;
type Business = BusinessRow;

interface AuthResponse {
  user: User;
  business: Business | null;
}

export function useAuth() {
  const queryClient = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery<AuthResponse>({
    queryKey: ["auth"],
    queryFn: async () => {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 401) {
          return { user: null, business: null };
        }
        throw new Error("Failed to fetch user data");
      }
      return response.json();
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const user = data?.user || null;
  const business = data?.business || null;

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      queryClient.setQueryData(["auth"], null);
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return {
    user,
    business,
    isLoading,
    error,
    isAuthenticated: !!data?.user,
    refetch,
    logout,
  };
}
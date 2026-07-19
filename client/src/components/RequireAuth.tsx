import { ReactNode } from "react";
import { Redirect } from "wouter";
import { useAuth } from "../hooks/useAuth";

interface RequireAuthProps {
  children: ReactNode;
}

/**
 * Gates the admin dashboard behind a login.
 *
 * This replaces the multi-tenant RequireOnboarding guard: with a single pinned
 * business there is no tenant-onboarding wizard to complete, so the only
 * question left is whether the user is signed in.
 */
export function RequireAuth({ children }: RequireAuthProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <>{children}</>;
}

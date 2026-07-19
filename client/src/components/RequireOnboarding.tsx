
import { ReactNode } from "react";
import { Redirect, useLocation } from "wouter";
import { useAuth } from "../hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { OnboardingBanner } from "./OnboardingBanner";

interface RequireOnboardingProps {
  children: ReactNode;
}

interface Business {
  id: string;
  onboardingStep: number;
  onboardingComplete: boolean;
}

export function RequireOnboarding({ children }: RequireOnboardingProps) {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  // Fetch business data if user has a businessId
  const { data: business, isLoading: isLoadingBusiness } = useQuery<Business>({
    queryKey: ["/api/businesses", user?.businessId],
    queryFn: async () => {
      if (!user?.businessId) return null;
      const response = await fetch(`/api/businesses/${user.businessId}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch business");
      return response.json();
    },
    enabled: !!user?.businessId,
  });

  if (isLoading || isLoadingBusiness) {
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

  // User is logged in but has no business - redirect to onboarding
  if (!user.businessId) {
    return <Redirect to="/onboarding" />;
  }

  // User has a business but hasn't completed onboarding
  // Show banner on dashboard pages, but don't block access
  if (business && !business.onboardingComplete && !location.includes("/onboarding")) {
    return (
      <>
        <OnboardingBanner step={business.onboardingStep} totalSteps={6} />
        {children}
      </>
    );
  }

  // User has completed onboarding - allow full access
  return <>{children}</>;
}

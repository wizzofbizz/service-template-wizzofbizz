import { useQuery, useQueryClient } from "@tanstack/react-query";

interface User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  businessId: string | null;
  profileImageUrl: string | null;
  role: string;
}

interface Business {
  id: string;
  businessName: string;
  slug: string;
  industry: string | null;
  ownerName: string | null;
  email: string;
  phone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  businessDescription: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  operatingHours: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  whatsappNumber: string | null;
  websiteUrl: string | null;
  websiteStatus: string;
  subscriptionStatus: string;
  subscriptionTier: string;
  vatNumber: string | null;
  vatRate: string | null;
  defaultPaymentDueDays: number | null;
  paymentReminderDays: number[] | null;
  senderEmail: string | null;
  senderName: string | null;
  senderEmailVerified: boolean | null;
  businessWhatsapp: string | null;
  whatsappWasenderApiKey: string | null;
  whatsappProvider: string | null;
  quoteFollowupDays: number[] | null;
  jobReminderDays: number[] | null;
  createdAt: Date;
  updatedAt: Date;
}

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
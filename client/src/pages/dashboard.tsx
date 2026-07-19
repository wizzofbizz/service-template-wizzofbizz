import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

interface User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  businessId: string | null;
  role: string;
}

interface Business {
  id: string;
  businessName: string;
  slug: string;
  email: string;
  websiteStatus: string;
  subscriptionStatus: string;
}

interface AuthResponse {
  user: User;
  business: Business | null;
}

export default function Dashboard() {
  const { data, isLoading } = useQuery<AuthResponse>({
    queryKey: ["/api/auth/me"],
  });
  
  const user = data?.user;
  const business = data?.business;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const userName = user?.firstName || user?.email || 'there';

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-xl text-muted-foreground">
            Welcome back, {userName}!
          </p>
          {business && (
            <p className="text-sm text-muted-foreground mt-1">
              Managing: <span className="font-medium">{business.businessName}</span>
            </p>
          )}
        </div>
        
        <div className="bg-card border rounded-lg p-8 text-center">
          <h2 className="text-2xl font-semibold mb-2">Dashboard Coming Soon</h2>
          <p className="text-muted-foreground mb-4">
            Your complete business management dashboard will be here.
          </p>
          {business && (
            <div className="mt-6 text-left max-w-md mx-auto">
              <h3 className="font-semibold mb-2">Business Info:</h3>
              <ul className="text-sm space-y-1">
                <li>Website: smartwebsite.co.za/{business.slug}</li>
                <li>Status: {business.websiteStatus}</li>
                <li>Subscription: {business.subscriptionStatus}</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

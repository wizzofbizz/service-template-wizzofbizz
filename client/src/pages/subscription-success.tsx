import { useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default function SubscriptionSuccessPage() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Optional: Track conversion event
    console.log("Subscription activated successfully");
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-6">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Subscription Activated!</CardTitle>
          <CardDescription>
            Welcome to Smart Website SaaS. Your subscription is now active.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <p className="text-sm text-gray-600">
              ✅ Full access to all features unlocked
            </p>
            <p className="text-sm text-gray-600">
              ✅ Unlimited contacts and quotes
            </p>
            <p className="text-sm text-gray-600">
              ✅ WhatsApp & email automation enabled
            </p>
            <p className="text-sm text-gray-600">
              ✅ Priority support activated
            </p>
          </div>

          <Button
            className="w-full bg-black hover:bg-gray-800"
            onClick={() => setLocation("/dashboard")}
          >
            Go to Dashboard
          </Button>

          <p className="text-xs text-center text-gray-500">
            You can manage your subscription from Settings at any time.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
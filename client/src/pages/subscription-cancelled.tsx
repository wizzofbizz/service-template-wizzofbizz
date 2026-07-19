import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

export default function SubscriptionCancelledPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-6">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
            <XCircle className="h-10 w-10 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl">Subscription Cancelled</CardTitle>
          <CardDescription>
            Your subscription payment was cancelled. No charges were made.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 text-center">
            You can try again anytime. Your free trial is still active.
          </p>

          <div className="space-y-2">
            <Button
              className="w-full bg-black hover:bg-gray-800"
              onClick={() => setLocation("/pricing")}
            >
              View Pricing Again
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => setLocation("/dashboard")}
            >
              Back to Dashboard
            </Button>
          </div>

          <p className="text-xs text-center text-gray-500">
            Need help? Contact our support team.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
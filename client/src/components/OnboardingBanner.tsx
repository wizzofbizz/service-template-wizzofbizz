
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { AlertCircle, X } from "lucide-react";
import { useState } from "react";

interface OnboardingBannerProps {
  step: number;
  totalSteps: number;
}

export function OnboardingBanner({ step, totalSteps }: OnboardingBannerProps) {
  const [, setLocation] = useLocation();
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) {
    return null;
  }

  const progress = Math.round((step / totalSteps) * 100);

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start flex-1">
          <AlertCircle className="h-5 w-5 text-yellow-400 mr-3 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-yellow-800">
              Complete Your Setup
            </h3>
            <p className="text-sm text-yellow-700 mt-1">
              You're {progress}% done! Complete your onboarding to unlock all features and start managing your business.
            </p>
            <div className="mt-3 flex gap-3">
              <Button
                size="sm"
                onClick={() => setLocation("/onboarding")}
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                Continue Setup
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsDismissed(true)}
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsDismissed(true)}
          className="text-yellow-400 hover:text-yellow-600 ml-4"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

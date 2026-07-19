import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Where PayFast returns the customer after a payment attempt.
 *
 * Deliberately does NOT claim the payment is confirmed: the ITN webhook is the
 * only trustworthy signal, and it may arrive moments later. The wording tells
 * the customer what happened without overstating it.
 */
export function PaymentSuccess() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8 text-center">
          <CheckCircle2 className="h-14 w-14 mx-auto text-green-600 mb-4" />
          <h1 className="text-2xl font-semibold mb-2">Thank you</h1>
          <p className="text-muted-foreground mb-6">
            Your payment has been submitted. We'll email you a confirmation once
            it clears — this usually takes a few moments.
          </p>
          <Button onClick={() => (window.location.href = "/")} className="w-full">
            Back to site
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function PaymentCancelled() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8 text-center">
          <XCircle className="h-14 w-14 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-semibold mb-2">Payment cancelled</h1>
          <p className="text-muted-foreground mb-6">
            No payment was taken. You can return to your invoice and try again
            whenever you're ready.
          </p>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="w-full"
          >
            Go back
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import PublicBook from "@/pages/public-book";
import PublicQuoteRequest from "@/pages/public-quote-request";

type BookingMode = "direct" | "quote_first" | "quote_only";

/**
 * Renders whichever booking flow the owner selected in
 * Dashboard -> Settings -> Booking.
 *
 * The mode is read from the server rather than build-time config, so changing
 * it takes effect immediately without a rebuild or redeploy. Both /book and
 * /quote route through here, so a link to either always lands the customer in
 * the correct flow.
 */
export default function BookingRouter() {
  const [mode, setMode] = useState<BookingMode | null>(null);

  useEffect(() => {
    fetch("/api/public/booking-mode")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setMode((data?.bookingMode as BookingMode) || "quote_first"))
      // Falling back to quoting is the safe default: it never confirms a
      // booking the business did not intend to accept.
      .catch(() => setMode("quote_first"));
  }, []);

  if (!mode) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" data-testid="loader-booking-mode" />
      </div>
    );
  }

  return mode === "direct" ? <PublicBook /> : <PublicQuoteRequest />;
}

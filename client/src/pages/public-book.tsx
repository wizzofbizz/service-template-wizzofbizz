import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Loader2, Clock } from "lucide-react";
import { SlotPicker } from "@/components/SlotPicker";

interface Service {
  id: string;
  serviceName: string;
  description: string | null;
  basePrice: string | null;
  durationMinutes: number | null;
}

interface Business {
  id: string;
  businessName: string;
  primaryColor?: string;
}

/**
 * Direct booking: pick a service, pick a slot, confirm.
 *
 * Used when the owner sets booking mode to "direct" — no quote step, because
 * the price and duration are known up front.
 */
export default function PublicBook() {
  const [, navigate] = useLocation();

  const [step, setStep] = useState(1);
  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmed, setConfirmed] = useState<{ jobNumber: string } | null>(null);
  // Bumped when the server rejects a slot, forcing fresh availability.
  const [slotRefreshKey, setSlotRefreshKey] = useState(0);

  const totalSteps = 3;
  const selectedService = services.find((s) => s.id === selectedServiceId);

  useEffect(() => {
    fetch("/api/public/services/current")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        setBusiness(data.business);
        setServices(data.services || []);
      })
      .catch(() => setError("Unable to load services. Please try again later."))
      .finally(() => setLoading(false));
  }, []);

  const formatPrice = (price: string | null) =>
    price ? `R${parseFloat(price).toFixed(2)}` : "Price on request";

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/public/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: selectedServiceId,
          date: selectedDate ? selectedDate.toISOString().split("T")[0] : "",
          time: selectedTime,
          notes,
          contactInfo: { fullName, email, phone },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // A 409 means someone else took the slot while this form was open.
        setError(data.message || "Unable to complete your booking. Please try again.");
        if (response.status === 409) {
          setSelectedTime("");
          setSlotRefreshKey((k) => k + 1);
          setStep(2);
        }
        setSubmitting(false);
        return;
      }

      setConfirmed({ jobNumber: data.job.jobNumber });
    } catch {
      setError("Unable to complete your booking. Please try again.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" data-testid="loader-booking" />
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 text-center">
            <CheckCircle2 className="h-14 w-14 mx-auto text-green-600 mb-4" />
            <h1 className="text-2xl font-semibold mb-2">You're booked in</h1>
            <p className="text-muted-foreground mb-2">
              {selectedService?.serviceName} on{" "}
              {selectedDate?.toLocaleDateString("en-ZA", {
                weekday: "long", day: "numeric", month: "long",
              })}{" "}
              at {selectedTime}.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Reference {confirmed.jobNumber}
              {email ? " — a confirmation is on its way to your inbox." : ""}
            </p>
            <Button onClick={() => navigate("/")} className="w-full">
              Back to site
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-semibold">{business?.businessName}</h1>
          <p className="text-muted-foreground">Book an appointment</p>
        </div>

        <Progress value={(step / totalSteps) * 100} className="mb-6" />

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Choose a service</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {services.length === 0 && (
                <p className="text-muted-foreground">
                  No services are available to book right now.
                </p>
              )}
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => {
                    setSelectedServiceId(service.id);
                    setStep(2);
                  }}
                  className="w-full text-left rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                  data-testid={`service-option-${service.id}`}
                >
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="font-medium">{service.serviceName}</p>
                      {service.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {service.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-medium">{formatPrice(service.basePrice)}</p>
                      {service.durationMinutes && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 justify-end mt-1">
                          <Clock className="h-3 w-3" />
                          {service.durationMinutes} min
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Pick a time</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <SlotPicker
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onDateSelect={setSelectedDate}
                onTimeSelect={setSelectedTime}
                refreshKey={slotRefreshKey}
              />
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!selectedDate || !selectedTime}
                  className="flex-1"
                  data-testid="button-time-next"
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Your details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  data-testid="input-full-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="input-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  data-testid="input-phone"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Please give us at least one way to reach you.
              </p>
              <div className="space-y-2">
                <Label htmlFor="notes">Anything we should know? (optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  data-testid="input-notes"
                />
              </div>

              <div className="rounded-lg bg-muted p-4 text-sm">
                <p className="font-medium">{selectedService?.serviceName}</p>
                <p className="text-muted-foreground">
                  {selectedDate?.toLocaleDateString("en-ZA", {
                    weekday: "long", day: "numeric", month: "long",
                  })}{" "}
                  at {selectedTime} · {formatPrice(selectedService?.basePrice ?? null)}
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !fullName || (!email && !phone)}
                  className="flex-1"
                  data-testid="button-confirm-booking"
                >
                  {submitting ? "Booking..." : "Confirm booking"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

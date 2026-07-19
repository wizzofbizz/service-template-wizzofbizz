import { useEffect, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface SlotPickerProps {
  selectedDate: Date | undefined;
  selectedTime: string;
  onDateSelect: (date: Date | undefined) => void;
  onTimeSelect: (time: string) => void;
  /** Optional cache-buster so a rejected slot forces a refetch. */
  refreshKey?: number;
}

/**
 * Date + time slot picker driven by the business's live availability.
 *
 * Unlike CalendarBooking (which owns the whole quote-booking submission),
 * this is a controlled component: it only reports the chosen date and time,
 * leaving the caller to submit. That lets it serve direct booking, where the
 * booking request carries service and contact details too.
 */
export function SlotPicker({
  selectedDate,
  selectedTime,
  onDateSelect,
  onTimeSelect,
  refreshKey = 0,
}: SlotPickerProps) {
  const [availableSlots, setAvailableSlots] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch(`/api/public/current/availability`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((slots) => {
        if (!cancelled) setAvailableSlots(slots || {});
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load available times. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" data-testid="loader-slots" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-600 py-4">{error}</p>;
  }

  const bookableDays = Object.keys(availableSlots).filter(
    (day) => (availableSlots[day] || []).length > 0
  );

  if (bookableDays.length === 0) {
    return (
      <p className="text-muted-foreground py-4">
        There are no times available at the moment. Please check back soon or get
        in touch with us directly.
      </p>
    );
  }

  const toKey = (d: Date) => {
    // Local date key — toISOString() would shift the day in +hh timezones.
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const timesForSelected = selectedDate ? availableSlots[toKey(selectedDate)] || [] : [];

  return (
    <div className="space-y-4">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={(date) => {
          onDateSelect(date);
          onTimeSelect(""); // a new day invalidates the chosen time
        }}
        disabled={(date) => !bookableDays.includes(toKey(date))}
        className="rounded-md border"
      />

      {selectedDate && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Available times on{" "}
            {selectedDate.toLocaleDateString("en-ZA", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
          {timesForSelected.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No times left on this day — please choose another.
            </p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {timesForSelected.map((time) => (
                <Button
                  key={time}
                  type="button"
                  variant={selectedTime === time ? "default" : "outline"}
                  onClick={() => onTimeSelect(time)}
                  data-testid={`slot-${time}`}
                >
                  {time}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

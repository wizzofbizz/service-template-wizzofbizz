
import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CalendarBookingProps {
  businessSlug: string;
  quoteId: string;
  token: string;
  onBookingComplete: () => void;
}

export function CalendarBooking({ businessSlug, quoteId, token, onBookingComplete }: CalendarBookingProps) {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [notes, setNotes] = useState("");
  const [availableSlots, setAvailableSlots] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const response = await fetch(`/api/public/${businessSlug}/availability?quoteId=${quoteId}`);
        if (!response.ok) throw new Error("Failed to fetch availability");
        
        const slots = await response.json();
        setAvailableSlots(slots);
      } catch (err) {
        toast({
          title: "Error",
          description: "Could not load available booking slots",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [businessSlug, quoteId]);

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime) {
      toast({
        title: "Missing information",
        description: "Please select a date and time",
        variant: "destructive",
      });
      return;
    }

    if (!token) {
      toast({
        title: "Error",
        description: "Missing authentication token",
        variant: "destructive",
      });
      return;
    }

    setBooking(true);
    try {
      const response = await fetch(`/api/public/quotes/${quoteId}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token,
          date: selectedDate.toISOString().split('T')[0],
          time: selectedTime,
          notes,
        }),
      });

      if (!response.ok) throw new Error("Booking failed");

      toast({
        title: "Booking confirmed!",
        description: "You'll receive a confirmation email shortly",
      });

      onBookingComplete();
    } catch (err) {
      toast({
        title: "Booking failed",
        description: "Please try again or contact us directly",
        variant: "destructive",
      });
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const availableDates = Object.keys(availableSlots).map(dateStr => new Date(dateStr));
  const availableTimesForDate = selectedDate
    ? availableSlots[selectedDate.toISOString().split('T')[0]] || []
    : [];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Select a Date</Label>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          disabled={(date) => {
            const dateStr = date.toISOString().split('T')[0];
            return !availableSlots[dateStr] || availableSlots[dateStr].length === 0;
          }}
          className="rounded-md border"
        />
      </div>

      {selectedDate && (
        <div className="space-y-2">
          <Label>Available Times for {selectedDate.toLocaleDateString()}</Label>
          {availableTimesForDate.length === 0 ? (
            <div className="text-sm text-gray-500 py-4 text-center border rounded-lg">
              No available times for this date
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {availableTimesForDate.map((time) => (
                <Button
                  key={time}
                  variant={selectedTime === time ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTime(time)}
                  className="w-full"
                >
                  {time}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedTime && (
        <div className="space-y-2">
          <Label htmlFor="notes">Additional Notes (Optional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special requirements or information we should know..."
            rows={3}
          />
        </div>
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => window.history.back()}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          onClick={handleBooking}
          disabled={!selectedDate || !selectedTime || booking}
          className="flex-1"
        >
          {booking ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Booking...
            </>
          ) : (
            "Confirm Booking"
          )}
        </Button>
      </div>
    </div>
  );
}

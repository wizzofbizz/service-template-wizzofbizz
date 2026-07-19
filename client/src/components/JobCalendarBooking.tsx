
import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Clock, Calendar as CalendarIcon, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface JobCalendarBookingProps {
  onDateTimeSelect: (date: string, startTime: string, endTime: string) => void;
  selectedDate?: string;
  selectedStartTime?: string;
  businessId: string;
}

interface Business {
  id: string;
  calendarHours: {
    monday: { start: string; end: string } | null;
    tuesday: { start: string; end: string } | null;
    wednesday: { start: string; end: string } | null;
    thursday: { start: string; end: string } | null;
    friday: { start: string; end: string } | null;
    saturday: { start: string; end: string } | null;
    sunday: { start: string; end: string } | null;
  };
  quoteVisitDurationMinutes: number;
  bufferBetweenVisitsMinutes: number;
  timeSlotIntervalMinutes: number;
  bookingWindowDays: number;
  minimumNoticeHours: number;
}

interface Job {
  id: string;
  jobNumber: string;
  title: string;
  scheduledDate: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  status: string;
  contactName?: string;
  locationAddress?: string;
}

export function JobCalendarBooking({
  onDateTimeSelect,
  selectedDate,
  selectedStartTime,
  businessId,
}: JobCalendarBookingProps) {
  const [date, setDate] = useState<Date | undefined>(
    selectedDate ? new Date(selectedDate) : undefined
  );
  const [selectedTime, setSelectedTime] = useState(selectedStartTime || "");
  const [availableSlots, setAvailableSlots] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch business settings
  const { data: business } = useQuery<Business>({
    queryKey: [`/api/businesses/${businessId}`],
    queryFn: async () => {
      const res = await fetch(`/api/businesses/${businessId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch business");
      return res.json();
    },
  });

  // Fetch existing jobs for the calendar
  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
    queryFn: async () => {
      const res = await fetch("/api/jobs", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch jobs");
      return res.json();
    },
  });

  // Calculate available slots
  useEffect(() => {
    if (!business) return;

    const calculateSlots = () => {
      const slots: Record<string, string[]> = {};
      const now = new Date();
      const minimumNoticeHours = business.minimumNoticeHours || 24;
      const bookingWindowDays = business.bookingWindowDays || 14;

      // Calculate earliest and latest booking times
      const earliestAllowed = new Date(now);
      earliestAllowed.setHours(earliestAllowed.getHours() + minimumNoticeHours);

      const latestAllowed = new Date(now);
      latestAllowed.setDate(latestAllowed.getDate() + bookingWindowDays);

      let currentDate = new Date(earliestAllowed);
      currentDate.setHours(0, 0, 0, 0);

      while (currentDate <= latestAllowed) {
        const dateStr = currentDate.toISOString().split("T")[0];
        const days: (keyof typeof business.calendarHours)[] = [
          'sunday',
          'monday',
          'tuesday',
          'wednesday',
          'thursday',
          'friday',
          'saturday',
        ];
        const dayName = days[currentDate.getDay()];

        const dayHours = business.calendarHours[dayName];

        if (dayHours) {
          const daySlots = generateDaySlotsWithConflicts(
            currentDate,
            dayHours,
            jobs,
            business.quoteVisitDurationMinutes || 60,
            business.bufferBetweenVisitsMinutes || 15,
            business.timeSlotIntervalMinutes || 15,
            earliestAllowed
          );

          if (daySlots.length > 0) {
            slots[dateStr] = daySlots;
          }
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      setAvailableSlots(slots);
      setLoading(false);
    };

    calculateSlots();
  }, [business?.id, jobs.length]);

  const generateDaySlotsWithConflicts = (
    date: Date,
    dayHours: { start: string; end: string },
    existingJobs: Job[],
    visitDurationMinutes: number,
    bufferMinutes: number,
    slotIntervalMinutes: number,
    earliestAllowed: Date
  ): string[] => {
    const slots: string[] = [];
    const [startHour, startMinute] = dayHours.start.split(":").map(Number);
    const [endHour, endMinute] = dayHours.end.split(":").map(Number);

    let currentMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    while (currentMinutes + visitDurationMinutes <= endMinutes) {
      const slotStart = minutesToTime(currentMinutes);
      const slotEnd = minutesToTime(currentMinutes + visitDurationMinutes);

      // Check if slot is after minimum notice
      const slotDateTime = new Date(date);
      const [slotHour, slotMinute] = slotStart.split(":").map(Number);
      slotDateTime.setHours(slotHour, slotMinute, 0, 0);

      if (slotDateTime >= earliestAllowed) {
        // Check for conflicts with existing jobs
        const hasConflict = hasTimeConflict(
          date,
          slotStart,
          slotEnd,
          existingJobs,
          bufferMinutes
        );

        if (!hasConflict) {
          slots.push(slotStart);
        }
      }

      currentMinutes += slotIntervalMinutes;
    }

    return slots;
  };

  const hasTimeConflict = (
    date: Date,
    slotStart: string,
    slotEnd: string,
    existingJobs: Job[],
    bufferMinutes: number
  ): boolean => {
    const dateStr = date.toISOString().split("T")[0];
    const slotStartMinutes = timeToMinutes(slotStart);
    const slotEndMinutes = timeToMinutes(slotEnd);

    for (const job of existingJobs) {
      const jobDateStr = job.scheduledDate?.split("T")[0];
      if (jobDateStr !== dateStr) continue;

      if (!job.scheduledStartTime || !job.scheduledEndTime) continue;

      const jobStartMinutes =
        timeToMinutes(job.scheduledStartTime) - bufferMinutes;
      const jobEndMinutes = timeToMinutes(job.scheduledEndTime) + bufferMinutes;

      // Check for overlap
      if (
        (slotStartMinutes >= jobStartMinutes &&
          slotStartMinutes < jobEndMinutes) ||
        (slotEndMinutes > jobStartMinutes &&
          slotEndMinutes <= jobEndMinutes) ||
        (slotStartMinutes <= jobStartMinutes &&
          slotEndMinutes >= jobEndMinutes)
      ) {
        return true;
      }
    }

    return false;
  };

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}`;
  };

  const handleDateSelect = (newDate: Date | undefined) => {
    setDate(newDate);
    setSelectedTime("");
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    if (date && business) {
      const endTimeMinutes =
        timeToMinutes(time) + (business.quoteVisitDurationMinutes || 60);
      const endTime = minutesToTime(endTimeMinutes);
      onDateTimeSelect(date.toISOString().split("T")[0], time, endTime);
    }
  };

  // Get jobs for selected date and sort by time (ascending)
  const selectedDateJobs =
    date && jobs
      ? jobs
          .filter(
            (job) =>
              job.scheduledDate?.split("T")[0] ===
              date.toISOString().split("T")[0]
          )
          .sort((a, b) => a.scheduledStartTime.localeCompare(b.scheduledStartTime))
      : [];

  const availableTimesForDate = date
    ? availableSlots[date.toISOString().split("T")[0]] || []
    : [];

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6" role="region" aria-label="Calendar booking selection">
      <Label className="text-base font-semibold flex items-center gap-2">
        <CalendarIcon className="h-5 w-5" />
        Select Date & Time *
      </Label>
      <div className="space-y-4">
          <div className="space-y-2">
            <Label>Select a Date *</Label>
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              disabled={(checkDate) => {
                const dateStr = checkDate.toISOString().split("T")[0];
                return (
                  !availableSlots[dateStr] ||
                  availableSlots[dateStr].length === 0
                );
              }}
              className="rounded-md border"
            />
          </div>

          {date && (
            <>
              <div className="space-y-2">
                <Label>
                  Available Times for{" "} *
                  {date.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </Label>
                {availableTimesForDate.length === 0 ? (
                  <div className="text-sm text-gray-500 py-4 text-center border rounded-lg">
                    No available times for this date
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {availableTimesForDate.map((time) => (
                      <Button
                        key={time}
                        type="button"
                        variant={selectedTime === time ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleTimeSelect(time)}
                        className="w-full"
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        {time}
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              {selectedDateJobs.length > 0 && (
                <div className="space-y-2">
                  <Label>Existing Appointments on This Date</Label>
                  <div className="space-y-3">
                    {selectedDateJobs.map((job) => (
                      <div
                        key={job.id}
                        className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <div className="flex gap-3 p-3">
                          {/* Time slot section */}
                          <div className="flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 rounded-md px-3 py-2 min-w-fit">
                            <div className="text-xs text-muted-foreground font-medium">Time</div>
                            <div className="text-sm font-bold text-primary">
                              {job.scheduledStartTime}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              -{job.scheduledEndTime}
                            </div>
                          </div>

                          {/* Main content section */}
                          <div className="flex-1 space-y-1.5 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <h4 className="font-semibold text-sm leading-snug">
                                  {job.title}
                                </h4>
                                {job.contactName && (
                                  <p className="text-xs text-muted-foreground leading-snug">
                                    {job.contactName}
                                  </p>
                                )}
                              </div>
                              <Badge
                                variant={
                                  job.status === "completed"
                                    ? "default"
                                    : job.status === "cancelled"
                                    ? "destructive"
                                    : job.status === "in_progress"
                                    ? "secondary"
                                    : "outline"
                                }
                                className="text-xs shrink-0 ml-2"
                              >
                                {job.status.replace(/_/g, " ")}
                              </Badge>
                            </div>

                            {/* Address section */}
                            {job.locationAddress && (
                              <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary/70" />
                                <span className="leading-snug break-words">
                                  {job.locationAddress}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
    </div>
  );
}

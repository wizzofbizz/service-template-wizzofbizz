
import type { Job } from "../shared/schema";

interface TimeSlot {
  start: string; // HH:MM format
  end: string;
}

interface DayHours {
  start: string;
  end: string;
}

interface CalendarHours {
  monday: DayHours | null;
  tuesday: DayHours | null;
  wednesday: DayHours | null;
  thursday: DayHours | null;
  friday: DayHours | null;
  saturday: DayHours | null;
  sunday: DayHours | null;
}

/**
 * Formats a Date as YYYY-MM-DD in LOCAL time.
 *
 * toISOString() must not be used for calendar keys: it converts to UTC first,
 * so in any positive-offset timezone (e.g. SAST, UTC+2) a local midnight
 * becomes 22:00 the PREVIOUS day, and every availability key lands on the
 * wrong date.
 */
function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Removes slots that clash with external commitments (currently Google
 * Calendar). Applied after the in-house calculation so the engine stays
 * synchronous and testable, and so a calendar outage degrades to "no external
 * busy times known" rather than breaking availability entirely.
 */
export async function filterByExternalBusy(
  slots: Record<string, string[]>,
  visitDurationMinutes: number,
  timezoneOffsetMinutes = new Date().getTimezoneOffset()
): Promise<Record<string, string[]>> {
  const days = Object.keys(slots);
  if (days.length === 0) return slots;

  const { isCalendarConfigured, getBusyPeriods } = await import("./google-calendar");
  if (!isCalendarConfigured()) return slots;

  const sorted = [...days].sort();
  const from = new Date(`${sorted[0]}T00:00:00`);
  const to = new Date(`${sorted[sorted.length - 1]}T23:59:59`);

  const busy = await getBusyPeriods(from, to);
  if (busy.length === 0) return slots;

  const filtered: Record<string, string[]> = {};

  for (const day of days) {
    filtered[day] = (slots[day] || []).filter((time) => {
      const start = new Date(`${day}T${time}:00`);
      const end = new Date(start.getTime() + visitDurationMinutes * 60_000);

      // Keep the slot only if it overlaps nothing already in the calendar.
      return !busy.some((period) => start < period.end && end > period.start);
    });
  }

  return filtered;
}

export class AvailabilityService {
  /**
   * Get available time slots for quote visits
   */
  static getAvailableSlots(
    calendarHours: CalendarHours,
    existingJobs: Job[],
    visitDurationMinutes: number,
    bufferMinutes: number,
    slotIntervalMinutes: number,
    startDate: Date,
    endDate: Date
  ): Record<string, string[]> {
    const availableSlots: Record<string, string[]> = {};
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = toLocalDateKey(currentDate);
      const dayName = this.getDayName(currentDate);
      const dayHours = calendarHours[dayName];

      if (dayHours) {
        const slots = this.generateDaySlots(
          currentDate,
          dayHours,
          existingJobs,
          visitDurationMinutes,
          bufferMinutes,
          slotIntervalMinutes
        );
        if (slots.length > 0) {
          availableSlots[dateStr] = slots;
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return availableSlots;
  }

  /**
   * Generate available slots for a specific day
   */
  private static generateDaySlots(
    date: Date,
    dayHours: DayHours,
    existingJobs: Job[],
    visitDurationMinutes: number,
    bufferMinutes: number,
    slotIntervalMinutes: number
  ): string[] {
    const slots: string[] = [];
    const [startHour, startMinute] = dayHours.start.split(':').map(Number);
    const [endHour, endMinute] = dayHours.end.split(':').map(Number);

    // Generate slots at configured intervals
    let currentMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    while (currentMinutes + visitDurationMinutes <= endMinutes) {
      const slotStart = this.minutesToTime(currentMinutes);
      const slotEnd = this.minutesToTime(currentMinutes + visitDurationMinutes);

      // Check if slot conflicts with existing jobs
      const hasConflict = this.hasConflict(
        date,
        slotStart,
        slotEnd,
        existingJobs,
        bufferMinutes
      );

      if (!hasConflict) {
        slots.push(slotStart);
      }

      currentMinutes += slotIntervalMinutes;
    }

    return slots;
  }

  /**
   * Check if a time slot conflicts with existing jobs
   */
  private static hasConflict(
    date: Date,
    slotStart: string,
    slotEnd: string,
    existingJobs: Job[],
    bufferMinutes: number
  ): boolean {
    const dateStr = toLocalDateKey(date);

    const slotStartMinutes = this.timeToMinutes(slotStart);
    const slotEndMinutes = this.timeToMinutes(slotEnd);

    for (const job of existingJobs) {
      const jobDateStr = job.scheduledDate?.split('T')[0];
      if (jobDateStr !== dateStr) continue;

      if (!job.scheduledStartTime || !job.scheduledEndTime) continue;

      const jobStartMinutes = this.timeToMinutes(job.scheduledStartTime) - bufferMinutes;
      const jobEndMinutes = this.timeToMinutes(job.scheduledEndTime) + bufferMinutes;

      // Check for overlap
      if (
        (slotStartMinutes >= jobStartMinutes && slotStartMinutes < jobEndMinutes) ||
        (slotEndMinutes > jobStartMinutes && slotEndMinutes <= jobEndMinutes) ||
        (slotStartMinutes <= jobStartMinutes && slotEndMinutes >= jobEndMinutes)
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Convert HH:MM to minutes since midnight
   */
  private static timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Convert minutes since midnight to HH:MM
   */
  private static minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * Get day name from date
   */
  private static getDayName(date: Date): keyof CalendarHours {
    const days: (keyof CalendarHours)[] = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];
    return days[date.getDay()];
  }
}

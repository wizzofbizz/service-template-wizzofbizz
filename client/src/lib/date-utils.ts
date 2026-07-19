import { format, parseISO } from 'date-fns';

/**
 * Formats a date to South African format (dd/MM/yyyy)
 */
export function formatDateSA(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'dd/MM/yyyy');
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

/**
 * Formats a datetime to South African format with time (dd/MM/yyyy HH:mm)
 */
export function formatDateTimeSA(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'dd/MM/yyyy HH:mm');
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return '';
  }
}

/**
 * Formats a time string to HH:mm format
 */
export function formatTime(time: string | null | undefined): string {
  if (!time) return '';
  return time.substring(0, 5); // Extract HH:mm from HH:mm:ss
}

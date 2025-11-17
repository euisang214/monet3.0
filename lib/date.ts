import { format } from 'date-fns';

/**
 * Format date and time in short format: MM/dd HH:mm
 */
export function formatDateTime(input: Date | string) {
  return format(new Date(input), 'MM/dd HH:mm');
}

/**
 * Format date in full format: MMMM d, yyyy
 */
export function formatDate(input: Date | string) {
  return format(new Date(input), 'MMMM d, yyyy');
}

/**
 * Format date in ISO format: yyyy-MM-dd
 */
export function formatDateISO(input: Date | string) {
  return format(new Date(input), 'yyyy-MM-dd');
}

/**
 * Format time only: hh:mm a
 */
export function formatTime(input: Date | string) {
  return format(new Date(input), 'hh:mm a');
}

/**
 * Format for ICS calendar files
 */
export function formatICS(input: Date | string) {
  const date = new Date(input);
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

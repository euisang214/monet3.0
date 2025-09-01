import { format } from 'date-fns';

export function formatDateTime(input: Date | string) {
  return format(new Date(input), 'MM/dd HH:mm');
}

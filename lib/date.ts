import { format } from 'date-fns';

export function formatDateTime(input: Date | string) {
  return format(new Date(input), 'yyyy-MM-dd HH:mm:ss');
}

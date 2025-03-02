// src/lib/date-utils.ts
import { format, formatRelative as formatRelativeFn, parseISO, formatDistance } from 'date-fns';

type DateFormat =
    | 'default'       // Feb 3, 2024
    | 'short'         // 02/03/2024 
    | 'iso'           // 2024-02-03
    | 'time'          // 3:45 PM
    | 'dateTime'      // Feb 3, 2024 3:45 PM
    | 'relative';     // 2 days ago

/**
 * Formats a date based on the specified format type
 */
export function formatDate(
    date: Date | string | null | undefined,
    formatType: DateFormat = 'default'
): string {
    if (!date) return '—';

    // Convert string to Date if needed
    const dateObj = typeof date === 'string' ? parseISO(date) : date;

    try {
        switch (formatType) {
            case 'default':
                return format(dateObj, 'MMM d, yyyy');
            case 'short':
                return format(dateObj, 'dd/MM/yyyy');
            case 'iso':
                return format(dateObj, 'yyyy-MM-dd');
            case 'time':
                return format(dateObj, 'HH:mm');
            case 'dateTime':
                return format(dateObj, 'MMM d, yyyy h:mm a');
            case 'relative':
                return formatDistance(dateObj, new Date(), { addSuffix: true });
            default:
                return format(dateObj, 'MMM d, yyyy');
        }
    } catch (error) {
        console.error('Error formatting date:', error);
        return '—';
    }
}
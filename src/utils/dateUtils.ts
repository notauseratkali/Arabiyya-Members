/**
 * Utility functions for formatting dates consistently across all pages as DD MMM YYYY (e.g. 05 SEP 2026)
 */

const MONTHS_UPPER = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/**
 * Formats a date string, timestamp, or Date object as DD MMM YYYY (e.g., "05 SEP 2026")
 */
export const formatDateDDMMMYYYY = (dateVal?: string | Date | number | null): string => {
  if (!dateVal) return '';
  
  if (typeof dateVal === 'string') {
    const trimmed = dateVal.trim();
    if (!trimmed) return '';

    // If it's already in DD MMM YYYY format (e.g., "05 SEP 2026"), return uppercase
    if (/^\d{1,2}\s+[A-Za-z]{3}\s+\d{4}$/.test(trimmed)) {
      const parts = trimmed.split(/\s+/);
      const day = parts[0].padStart(2, '0');
      return `${day} ${parts[1].toUpperCase()} ${parts[2]}`;
    }

    // Handle YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss without timezone shift
    const matchISO = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (matchISO) {
      const y = parseInt(matchISO[1], 10);
      const m = parseInt(matchISO[2], 10);
      const d = parseInt(matchISO[3], 10);
      if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
        const dayStr = String(d).padStart(2, '0');
        const monthStr = MONTHS_UPPER[m - 1];
        return `${dayStr} ${monthStr} ${y}`;
      }
    }
  }

  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);

  const dayStr = String(d.getDate()).padStart(2, '0');
  const monthStr = MONTHS_UPPER[d.getMonth()];
  const yearStr = d.getFullYear();
  return `${dayStr} ${monthStr} ${yearStr}`;
};

/**
 * Formats date and time as DD MMM YYYY, HH:MM AM/PM
 */
export const formatDateTimeDDMMMYYYY = (dateVal?: string | Date | number | null): string => {
  if (!dateVal) return '';

  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return formatDateDDMMMYYYY(dateVal);

  const dateFormatted = formatDateDDMMMYYYY(d);
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12
  const hoursStr = String(hours).padStart(2, '0');

  return `${dateFormatted}, ${hoursStr}:${minutes} ${ampm}`;
};

/**
 * Helper to format event date ranges (from -> to) in DD MMM YYYY format
 */
export const formatEventRangeDDMMMYYYY = (from?: string, to?: string): string => {
  if (!from) return 'Date & Time TBD';

  const fromFormattedDate = formatDateDDMMMYYYY(from);
  const fromTime = formatDateTimeDDMMMYYYY(from).split(', ')[1] || '';

  if (!to) {
    return `${fromFormattedDate}${fromTime ? ` at ${fromTime}` : ''}`;
  }

  const toFormattedDate = formatDateDDMMMYYYY(to);
  const toTime = formatDateTimeDDMMMYYYY(to).split(', ')[1] || '';

  if (fromFormattedDate === toFormattedDate) {
    return `${fromFormattedDate}${fromTime ? ` (${fromTime} - ${toTime})` : ''}`;
  }

  return `${fromFormattedDate}${fromTime ? ` ${fromTime}` : ''} - ${toFormattedDate}${toTime ? ` ${toTime}` : ''}`;
};

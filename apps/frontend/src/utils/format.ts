export function formatCurrency(amount: number, locale: string, currency: string): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      currencyDisplay: 'symbol',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Fallback if the currency/locale combination is invalid
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/**
 * Coerces various date inputs into a Date. If input is a date-only string (YYYY-MM-DD),
 * this treats it as local date at midnight to avoid UTC/DST surprises.
 */
export function parseToDate(value: string | Date): Date {
  if (value instanceof Date) return value;
  // Detect date-only input
  const dateOnlyMatch = /^\d{4}-\d{2}-\d{2}$/.test(value);
  if (dateOnlyMatch) {
    const [y, m, d] = value.split('-').map((v) => Number(v));
    return new Date(y, m - 1, d, 0, 0, 0, 0);
  }
  return new Date(value);
}

/**
 * Formats a date for display in the user's timezone by default.
 * Pass an explicit IANA timezone (e.g., 'America/New_York') to override.
 */
export function formatDate(value: string | Date, locale: string, timeZone?: string): string {
  const date = parseToDate(value);
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone }).format(date);
  } catch {
    // Fallback: omit timeZone if it's invalid
    try {
      return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
    } catch {
      return date.toLocaleDateString();
    }
  }
}

export function formatDateTime(value: string | Date, locale: string, timeZone?: string): string {
  const date = parseToDate(value);
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone,
    }).format(date);
  } catch {
    try {
      return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
    } catch {
      return date.toLocaleString();
    }
  }
}

/** Returns an ISO string in UTC, preserving exact instant. */
export function toIsoUtc(value: string | Date): string {
  return parseToDate(value).toISOString();
}

/** Returns 'YYYY-MM-DD' in local calendar for date-only fields. */
export function toDateOnlyLocal(value: string | Date): string {
  const d = parseToDate(value);
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

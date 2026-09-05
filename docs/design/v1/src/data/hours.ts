import type { Locale } from "./i18n/config";

/**
 * Opening hours, minutes from midnight. Monday-first.
 * `close` may exceed 1440 (= closing after midnight, e.g. 1560 = 2:00 AM next day).
 */
export type DayHours = { open: number; close: number };

export const WEEK_HOURS: DayHours[] = [
  { open: 840, close: 1380 }, // Monday    14:00 – 23:00
  { open: 840, close: 1440 }, // Tuesday   14:00 – 24:00
  { open: 840, close: 1500 }, // Wednesday 14:00 – 01:00 (+1)
  { open: 840, close: 1440 }, // Thursday  14:00 – 24:00
  { open: 840, close: 1560 }, // Friday    14:00 – 02:00 (+1)
  { open: 840, close: 1560 }, // Saturday  14:00 – 02:00 (+1)
  { open: 840, close: 1380 }, // Sunday    14:00 – 23:00
];

/** Monday-first day index (0 = Monday … 6 = Sunday) from a Date. */
export function mondayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

/** Minutes since midnight for a Date. */
export function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

/** Format minutes-from-midnight as a clock time for the locale. */
export function formatMinutes(min: number, locale: Locale): string {
  const m = ((min % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = String(m % 60).padStart(2, "0");
  if (locale === "en") {
    const period = h < 12 ? "AM" : "PM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${mm} ${period}`;
  }
  // hu / de use 24h clocks; show closing midnight as 24:00
  if (min === 1440) return "24:00";
  return `${h}:${mm}`;
}

export type OpenStatus = {
  isOpen: boolean;
  /** time shown for "until"/"opens", locale-formatted */
  time: string;
  /** 0-based (Mon-first) day index for the "opens" time when closed, or null if open */
  opensOnDay: number | null;
};

/** Pure helper — compute open/closed state from a Date (client local time). */
export function computeStatus(now: Date, locale: Locale): OpenStatus {
  const day = mondayIndex(now);
  const mins = minutesOfDay(now);
  const today = WEEK_HOURS[day];
  const yesterday = WEEK_HOURS[(day + 6) % 7];

  // Still open from yesterday's late night (e.g. 00:30 on Thursday after Wednesday 1 AM close)
  if (yesterday.close > 1440 && mins < yesterday.close - 1440) {
    return { isOpen: true, time: formatMinutes(yesterday.close, locale), opensOnDay: null };
  }
  if (mins >= today.open && mins < today.close) {
    return { isOpen: true, time: formatMinutes(today.close, locale), opensOnDay: null };
  }
  if (mins < today.open) {
    return { isOpen: false, time: formatMinutes(today.open, locale), opensOnDay: day };
  }
  const tomorrow = WEEK_HOURS[(day + 1) % 7];
  return { isOpen: false, time: formatMinutes(tomorrow.open, locale), opensOnDay: (day + 1) % 7 };
}

import type { OpeningHoursRow } from "./venue.ts";

export type BolLocale = "en" | "hu" | "de";

export type DayHours = { open: number; close: number };

const HHMM = /^(\d{1,2}):(\d{2})$/;

/** Parse "HH:MM" to minutes from midnight. Returns null when invalid. */
export function parseClock(value: string): number | null {
	const match = HHMM.exec(value.trim());
	if (!match) return null;
	const hours = Number(match[1]);
	const minutes = Number(match[2]);
	if (hours < 0 || hours > 24 || minutes < 0 || minutes > 59) return null;
	if (hours === 24 && minutes !== 0) return null;
	return hours * 60 + minutes;
}

/** Convert stored open/close strings to minute ranges (close may exceed 1440). */
export function rowToDayHours(row: OpeningHoursRow): DayHours | null {
	if (row.closed) return null;

	const open = parseClock(row.open);
	const close = parseClock(row.close);
	if (open === null || close === null) return null;

	let closeMinutes = close;
	if (closeMinutes <= open) closeMinutes += 1440;
	return { open, close: closeMinutes };
}

/** Closed days use open=close=0 so status logic skips them. */
export function rowsToWeekHours(rows: OpeningHoursRow[]): DayHours[] {
	return rows.map((row) => {
		if (row.closed) return { open: 0, close: 0 };
		return rowToDayHours(row) ?? { open: 0, close: 0 };
	});
}

/** Monday-first day index (0 = Monday … 6 = Sunday) from a Date. */
export function mondayIndex(date: Date): number {
	return (date.getDay() + 6) % 7;
}

/** Minutes since midnight for a Date. */
export function minutesOfDay(date: Date): number {
	return date.getHours() * 60 + date.getMinutes();
}

/** Format minutes-from-midnight as a clock time for the locale. */
export function formatMinutes(min: number, locale: BolLocale): string {
	const m = ((min % 1440) + 1440) % 1440;
	const h = Math.floor(m / 60);
	const mm = String(m % 60).padStart(2, "0");
	if (locale === "en") {
		const period = h < 12 ? "AM" : "PM";
		const h12 = h % 12 === 0 ? 12 : h % 12;
		return `${h12}:${mm} ${period}`;
	}
	if (min === 1440) return "24:00";
	return `${h}:${mm}`;
}

export type OpenStatus = {
	isOpen: boolean;
	time: string;
	opensOnDay: number | null;
};

/** Compute open/closed state from a Date using venue week hours. */
export function computeStatus(
	now: Date,
	locale: BolLocale,
	weekHours: DayHours[],
): OpenStatus {
	const day = mondayIndex(now);
	const mins = minutesOfDay(now);
	const today = weekHours[day] ?? { open: 0, close: 0 };
	const yesterday = weekHours[(day + 6) % 7] ?? { open: 0, close: 0 };

	if (yesterday.close > 1440 && mins < yesterday.close - 1440) {
		return {
			isOpen: true,
			time: formatMinutes(yesterday.close, locale),
			opensOnDay: null,
		};
	}
	if (today.close > today.open && mins >= today.open && mins < today.close) {
		return {
			isOpen: true,
			time: formatMinutes(today.close, locale),
			opensOnDay: null,
		};
	}
	if (today.close > today.open && mins < today.open) {
		return {
			isOpen: false,
			time: formatMinutes(today.open, locale),
			opensOnDay: day,
		};
	}

	for (let offset = 1; offset <= 7; offset += 1) {
		const nextDay = (day + offset) % 7;
		const hours = weekHours[nextDay] ?? { open: 0, close: 0 };
		if (hours.close > hours.open) {
			return {
				isOpen: false,
				time: formatMinutes(hours.open, locale),
				opensOnDay: nextDay,
			};
		}
	}

	return { isOpen: false, time: "", opensOnDay: null };
}

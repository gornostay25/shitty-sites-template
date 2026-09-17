import { applyTemplate } from "../../utils/format.ts";
import {
	computeStatus,
	mondayIndex,
	rowsToWeekHours,
	type BolLocale,
} from "../../utils/hours.ts";
import type { OpeningHoursRow } from "../../utils/venue.ts";

export type OpenNowConfig = {
	openingHours: OpeningHoursRow[];
	bolLocale: BolLocale;
	statusOpenTpl: string;
	statusClosedTpl: string;
	daysShort: string[];
};

export function initOpenNowBadge(badgeEl: HTMLElement, config: OpenNowConfig): void {
	const textEl = badgeEl.querySelector<HTMLElement>("[data-open-now-text]");
	if (!textEl) return;

	const weekHours = rowsToWeekHours(config.openingHours);

	function renderStatus(badge: HTMLElement, text: HTMLElement) {
		const status = computeStatus(new Date(), config.bolLocale, weekHours);
		const dot = badge.querySelector("span[aria-hidden]");
		if (status.isOpen) {
			badge.className =
				"inline-flex min-h-9 items-center gap-2 whitespace-nowrap rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300";
			if (dot) dot.className = "size-2 rounded-full bg-emerald-400 motion-safe:animate-pulse";
			text.textContent = applyTemplate(config.statusOpenTpl, { time: status.time });
		} else {
			badge.className =
				"inline-flex min-h-9 items-center gap-2 whitespace-nowrap rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted-foreground";
			if (dot) dot.className = "size-2 rounded-full bg-muted-foreground";
			const when =
				status.opensOnDay !== null && status.opensOnDay !== mondayIndex(new Date())
					? `${config.daysShort[status.opensOnDay]} ${status.time}`
					: status.time;
			text.textContent = applyTemplate(config.statusClosedTpl, { when });
		}
	}

	renderStatus(badgeEl, textEl);
	setInterval(() => renderStatus(badgeEl, textEl), 30_000);
}

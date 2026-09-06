import { useEffect, useState } from "react";
import {
	computeStatus,
	mondayIndex,
	rowsToWeekHours,
} from "../../utils/hours.ts";
import type { OpeningHoursRow } from "../../utils/venue.ts";
import { applyTemplate, toBolLocale } from "../../utils/format.ts";
import type { UiStrings } from "../../utils/i18n/en.ts";

type Props = {
	locale: string;
	openingHours: OpeningHoursRow[];
	ui: Pick<
		UiStrings["contact"],
		"statusOpenTpl" | "statusClosedTpl" | "daysShort"
	>;
};

export default function OpenNowBadge({ locale, openingHours, ui }: Props) {
	const bolLocale = toBolLocale(locale);
	const [status, setStatus] = useState<ReturnType<typeof computeStatus> | null>(
		null,
	);

	useEffect(() => {
		const weekHours = rowsToWeekHours(openingHours);
		const update = () =>
			setStatus(computeStatus(new Date(), bolLocale, weekHours));
		update();
		const id = setInterval(update, 30_000);
		return () => clearInterval(id);
	}, [bolLocale, openingHours]);

	return (
		<span
			aria-live="polite"
			className={`inline-flex min-h-9 items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold ${
				status === null
					? "border-border bg-surface"
					: status.isOpen
						? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
						: "border-border bg-surface text-muted-foreground"
			}`}
		>
			{status === null ? (
				<span className="size-2 rounded-full bg-muted-foreground" aria-hidden="true" />
			) : status.isOpen ? (
				<>
					<span
						className="size-2 rounded-full bg-emerald-400 motion-safe:animate-pulse"
						aria-hidden="true"
					/>
					{applyTemplate(ui.statusOpenTpl, { time: status.time })}
				</>
			) : (
				<>
					<span className="size-2 rounded-full bg-muted-foreground" aria-hidden="true" />
					{applyTemplate(ui.statusClosedTpl, {
						when:
							status.opensOnDay !== null &&
							status.opensOnDay !== mondayIndex(new Date())
								? `${ui.daysShort[status.opensOnDay]} ${status.time}`
								: status.time,
					})}
				</>
			)}
		</span>
	);
}

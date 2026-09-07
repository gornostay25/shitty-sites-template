import { useEffect, useState } from "react";

type CategoryTerm = { slug: string; label: string };

type Props = {
	filterLabel: string;
	allLabel: string;
	gridId: string;
	categories: CategoryTerm[];
};

type FilterSlug = "all" | string;

export default function ExperienceFilter({
	filterLabel,
	allLabel,
	gridId,
	categories,
}: Props) {
	const [active, setActive] = useState<FilterSlug>("all");
	const filters = [{ slug: "all", label: allLabel }, ...categories];

	useEffect(() => {
		const grid = document.getElementById(gridId);
		if (!grid) return;

		for (const card of grid.querySelectorAll<HTMLElement>("[data-experience-category]")) {
			const category = card.dataset.experienceCategory;
			const visible = active === "all" || category === active;
			card.hidden = !visible;
		}
	}, [active, gridId]);

	return (
		<div className="flex flex-wrap gap-2" role="group" aria-label={filterLabel}>
			{filters.map((filter) => {
				const pressed = active === filter.slug;
				return (
					<button
						key={filter.slug}
						type="button"
						onClick={() => setActive(filter.slug)}
						aria-pressed={pressed}
						className={
							pressed
								? "min-h-12 rounded-full border border-brand bg-brand px-5 text-sm font-semibold text-[#1c1305] transition-colors"
								: "min-h-12 rounded-full border border-border bg-surface px-5 text-sm font-semibold text-muted-foreground transition-colors hover:border-brand/40 hover:text-foreground"
						}
					>
						{filter.label}
					</button>
				);
			})}
		</div>
	);
}

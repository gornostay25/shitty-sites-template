import { useState } from "react";
import { formatHUF } from "../../utils/format.ts";

type MenuCategory = "alcoholic" | "nonalcoholic" | "snacks";

type MenuItemData = {
	id: string;
	name: string;
	description?: string;
	price: number;
	image?: {
		src?: string;
		alt?: string;
		width?: number;
		height?: number;
	};
};

type Props = {
	locale: string;
	title: string;
	tabLabels: Record<string, string>;
	items: Record<string, MenuItemData[]>;
	footnote?: string;
};

const TAB_ORDER: MenuCategory[] = ["alcoholic", "nonalcoholic", "snacks"];

export default function MenuTabs({
	locale,
	title,
	tabLabels,
	items,
	footnote,
}: Props) {
	const [active, setActive] = useState<MenuCategory>("alcoholic");

	return (
		<div>
			<div
				role="tablist"
				aria-label={title}
				className="scrollbar-slim -mx-1 flex gap-1 overflow-x-auto rounded-full border border-border bg-surface p-1 sm:mx-0 sm:inline-flex sm:w-auto sm:overflow-visible"
			>
				{TAB_ORDER.map((tab) => (
					<button
						key={tab}
						type="button"
						role="tab"
						id={`menu-tab-${tab}`}
						aria-selected={active === tab}
						aria-controls={`menu-panel-${tab}`}
						onClick={() => setActive(tab)}
						className={`min-h-12 shrink-0 rounded-full px-4 text-sm font-semibold transition-colors sm:px-6 ${
							active === tab
								? "bg-brand text-[#1c1305]"
								: "text-muted-foreground hover:text-foreground"
						}`}
					>
						{tabLabels[tab] ?? tab}
					</button>
				))}
			</div>

			{TAB_ORDER.map((tab) => (
				<div
					key={tab}
					role="tabpanel"
					id={`menu-panel-${tab}`}
					aria-labelledby={`menu-tab-${tab}`}
					hidden={active !== tab}
					className="mt-8"
				>
					<ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{(items[tab] ?? []).map((item) => (
							<li
								key={item.id}
								className="group overflow-hidden rounded-card border border-border bg-surface transition-all duration-300 hover:border-brand/40 hover:shadow-glow"
							>
								<div className="relative aspect-4/3 overflow-hidden">
									{item.image?.src ? (
										<img
											src={item.image.src}
											alt={item.image.alt ?? item.name}
											width={item.image.width}
											height={item.image.height}
											loading="lazy"
											className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
										/>
									) : (
										<div className="grid size-full place-items-center bg-surface-2 text-muted-foreground">
											<span className="text-sm">No image</span>
										</div>
									)}
									<span className="absolute right-3 top-3 rounded-full bg-background/90 px-3 py-1.5 font-display text-lg tracking-wide text-brand backdrop-blur">
										{formatHUF(item.price, locale)}
									</span>
								</div>
								<div className="p-4">
									<h3 className="font-display text-2xl tracking-wide">{item.name}</h3>
									{item.description && (
										<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
											{item.description}
										</p>
									)}
								</div>
							</li>
						))}
					</ul>
				</div>
			))}

			{footnote && <p className="mt-6 text-xs text-muted-foreground">{footnote}</p>}
		</div>
	);
}

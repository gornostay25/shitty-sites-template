export function initMenuTabs(root: HTMLElement): void {
	const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
	if (tabs.length === 0) return;

	const panels = new Map<string, HTMLElement>();
	for (const tab of tabs) {
		const slug = tab.dataset.tab;
		if (!slug) continue;
		const panel = root.querySelector<HTMLElement>(`#menu-panel-${slug}`);
		if (panel) panels.set(slug, panel);
	}

	const selectTab = (next: HTMLButtonElement) => {
		for (const tab of tabs) {
			const slug = tab.dataset.tab!;
			const panel = panels.get(slug);
			const selected = tab === next;
			tab.setAttribute("aria-selected", String(selected));
			tab.tabIndex = selected ? 0 : -1;
			if (panel) panel.hidden = !selected;
		}
		next.focus();
	};

	for (const tab of tabs) {
		tab.addEventListener("click", () => selectTab(tab));
		tab.addEventListener("keydown", (event) => {
			const idx = tabs.indexOf(tab);
			let target: HTMLButtonElement | undefined;
			switch (event.key) {
				case "ArrowRight":
				case "ArrowDown":
					target = tabs[(idx + 1) % tabs.length];
					break;
				case "ArrowLeft":
				case "ArrowUp":
					target = tabs[(idx - 1 + tabs.length) % tabs.length];
					break;
				case "Home":
					target = tabs[0];
					break;
				case "End":
					target = tabs[tabs.length - 1];
					break;
				default:
					return;
			}
			event.preventDefault();
			if (target) selectTab(target);
		});
	}
}

export function initAllMenuTabs(): void {
	document.querySelectorAll<HTMLElement>(".menu-tabs").forEach(initMenuTabs);
}

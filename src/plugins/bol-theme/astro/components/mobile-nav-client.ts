export function initMobileNav(): void {
	const dialog = document.getElementById("bol-mobile-nav");
	const trigger = document.querySelector<HTMLElement>(".bol-mobile-nav-trigger");
	if (!dialog || !trigger) return;

	const openLabel = trigger.dataset.openLabel ?? "";
	const closeLabel = trigger.dataset.closeLabel ?? "";

	dialog.addEventListener("toggle", (event) => {
		const open = (event as ToggleEvent).newState === "open";
		trigger.setAttribute("aria-expanded", String(open));
		trigger.setAttribute("aria-label", open ? closeLabel : openLabel);
	});

	dialog.addEventListener("click", (event) => {
		const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
		if (link && dialog.contains(link)) dialog.hidePopover();
	});
}

export function initGalleryLightbox(root: HTMLElement): void {
	const dialog = root.querySelector<HTMLDialogElement>("[data-gallery-dialog]");
	const img = root.querySelector<HTMLImageElement>("[data-gallery-img]");
	const caption = root.querySelector<HTMLElement>("[data-gallery-caption]");
	const grid = root.querySelector(".bol-gallery-grid");

	grid?.addEventListener("click", (event) => {
		const trigger =
			event.target instanceof Element ? event.target.closest(".bol-gallery__trigger") : null;
		if (!trigger || !dialog || !img || !caption) return;

		const src = (trigger as HTMLElement).dataset.src;
		const alt = (trigger as HTMLElement).dataset.alt ?? "";
		if (!src) return;

		img.src = src;
		img.alt = alt;
		caption.textContent = alt;
		if (typeof dialog.showPopover === "function") dialog.showPopover();
	});

	dialog?.addEventListener("click", (event) => {
		if (event.target === dialog) dialog.hidePopover();
	});

	root.querySelector("[data-gallery-close]")?.addEventListener("click", () => {
		dialog?.hidePopover();
	});
}

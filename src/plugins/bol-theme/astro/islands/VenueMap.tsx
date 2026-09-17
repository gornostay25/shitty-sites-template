import "leaflet/dist/leaflet.css";
import "../../styles/leaflet.css";
import { useEffect, useRef } from "react";

export type VenueMapProps = {
	lat: number;
	lng: number;
	title: string;
	address: string;
	ariaLabel: string;
};

export default function VenueMap({ lat, lng, title, address, ariaLabel }: VenueMapProps) {
	const rootRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const root = rootRef.current;
		if (!root || !Number.isFinite(lat) || !Number.isFinite(lng)) return;

		const canvas = root.querySelector<HTMLElement>(".venue-map-canvas");
		const loading = root.querySelector<HTMLElement>(".venue-map-loading");
		if (!canvas || canvas.dataset.initialized === "true") return;

		let cancelled = false;

		void (async () => {
			const L = (await import("leaflet")).default;
			if (cancelled) return;

			const map = L.map(canvas, { scrollWheelZoom: false }).setView([lat, lng], 16);
			const tileOptions = { maxNativeZoom: 16, maxZoom: 19 } as const;

			L.tileLayer(
				"https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
				{
					...tileOptions,
					attribution:
						'Tiles &copy; Esri — Source: Esri, HERE, Garmin, &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
				},
			).addTo(map);
			L.tileLayer(
				"https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
				tileOptions,
			).addTo(map);

			const pin = L.divIcon({
				className: "venue-pin-anchor",
				html: '<span class="venue-pin" aria-hidden="true"></span>',
				iconSize: [30, 30],
				iconAnchor: [15, 34],
				popupAnchor: [0, -30],
			});

			L.marker([lat, lng], { icon: pin, title })
				.addTo(map)
				.bindPopup(`<strong>${title}</strong><br/><span>${address}</span>`);

			canvas.dataset.initialized = "true";
			loading?.remove();
		})();

		return () => {
			cancelled = true;
		};
	}, [lat, lng, title, address]);

	return (
		<div
			ref={rootRef}
			className="venue-map relative h-64 w-full sm:h-72"
			role="region"
			aria-label={ariaLabel}
		>
			<div className="venue-map-canvas h-full w-full" />
			<div
				className="venue-map-loading absolute inset-0 grid place-items-center bg-surface"
				aria-hidden="true"
			>
				<span className="size-6 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />
			</div>
		</div>
	);
}

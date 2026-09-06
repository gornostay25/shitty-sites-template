import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import "../../styles/leaflet.css";

type VenueMapProps = {
	lat: number;
	lng: number;
	title: string;
	address: string;
};

export default function VenueMap({ lat, lng, title, address }: VenueMapProps) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const mapRef = useRef<LeafletMap | null>(null);
	const [ready, setReady] = useState(false);

	useEffect(() => {
		let cancelled = false;

		async function init() {
			const L = (await import("leaflet")).default;
			if (cancelled || !containerRef.current || mapRef.current) return;

			const map = L.map(containerRef.current, {
				scrollWheelZoom: false,
			}).setView([lat, lng], 16);

			const tileOptions = {
				maxNativeZoom: 16,
				maxZoom: 19,
			} as const;

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

			mapRef.current = map;
			setReady(true);
		}

		init();

		return () => {
			cancelled = true;
			mapRef.current?.remove();
			mapRef.current = null;
		};
	}, [lat, lng, title, address]);

	return (
		<div role="region" aria-label={title} className="venue-map relative h-64 w-full sm:h-72">
			<div ref={containerRef} className="h-full w-full" />
			{!ready && (
				<div
					className="absolute inset-0 grid place-items-center bg-surface"
					aria-hidden="true"
				>
					<span className="size-6 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />
				</div>
			)}
		</div>
	);
}

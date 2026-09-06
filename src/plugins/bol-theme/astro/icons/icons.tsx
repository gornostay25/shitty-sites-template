import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const defaults: IconProps = {
	fill: "none",
	stroke: "currentColor",
	strokeWidth: 2,
	strokeLinecap: "round",
	strokeLinejoin: "round",
	"aria-hidden": true,
};

export function Gamepad2Icon(props: IconProps) {
	return (
		<svg viewBox="0 0 24 24" {...defaults} {...props}>
			<line x1="6" x2="10" y1="11" y2="11" />
			<line x1="8" x2="8" y1="9" y2="13" />
			<line x1="15" x2="15.01" y1="12" y2="12" />
			<line x1="18" x2="18.01" y1="10" y2="10" />
			<path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z" />
		</svg>
	);
}

export function MenuIcon(props: IconProps) {
	return (
		<svg viewBox="0 0 24 24" {...defaults} {...props}>
			<line x1="4" x2="20" y1="12" y2="12" />
			<line x1="4" x2="20" y1="6" y2="6" />
			<line x1="4" x2="20" y1="18" y2="18" />
		</svg>
	);
}

export function XIcon(props: IconProps) {
	return (
		<svg viewBox="0 0 24 24" {...defaults} {...props}>
			<path d="M18 6 6 18" />
			<path d="m6 6 12 12" />
		</svg>
	);
}

export function ChevronRightIcon(props: IconProps) {
	return (
		<svg viewBox="0 0 24 24" {...defaults} {...props}>
			<path d="m9 18 6-6-6-6" />
		</svg>
	);
}

export function PhoneIcon(props: IconProps) {
	return (
		<svg viewBox="0 0 24 24" {...defaults} {...props}>
			<path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2.002 2.017A19.213 19.213 0 0 1 11.954 22.854 19.204 19.204 0 0 1 3 14.151 19.203 19.203 0 0 1 5.017 3.998 2 2 0 0 1 7 2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14.396 14.396 0 0 0 3.012 3.744" />
		</svg>
	);
}

export function BeerIcon(props: IconProps) {
	return (
		<svg viewBox="0 0 24 24" {...defaults} {...props}>
			<path d="M17 11h1a3 3 0 0 1 0 6h-1" />
			<path d="M9 12v6" />
			<path d="M13 12v6" />
			<path d="M14 7.5c-1 0-1.44.5-3 .5s-2-.5-3-.5-1.72.5-2.5.5a2.5 2.5 0 0 1 0-5c.78 0 1.57.5 2.5.5S9.44 2 11 2s2 1 3 2 1.72.5 2.5.5a2.5 2.5 0 0 1 0 5c-.78 0-1.5-.5-2.5-.5Z" />
			<path d="M5 8v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8" />
		</svg>
	);
}

export function MapPinIcon(props: IconProps) {
	return (
		<svg viewBox="0 0 24 24" {...defaults} {...props}>
			<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
			<circle cx="12" cy="10" r="3" />
		</svg>
	);
}

export function CalendarCheckIcon(props: IconProps) {
	return (
		<svg viewBox="0 0 24 24" {...defaults} {...props}>
			<path d="M8 2v4" />
			<path d="M16 2v4" />
			<rect width="18" height="18" x="3" y="4" rx="2" />
			<path d="M3 10h18" />
			<path d="m9 16 2 2 4-4" />
		</svg>
	);
}

export function MailIcon(props: IconProps) {
	return (
		<svg viewBox="0 0 24 24" {...defaults} {...props}>
			<rect width="20" height="16" x="2" y="4" rx="2" />
			<path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" />
		</svg>
	);
}

export function InstagramIcon(props: IconProps) {
	return (
		<svg viewBox="0 0 24 24" {...defaults} {...props}>
			<rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
			<path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
			<line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
		</svg>
	);
}

export function FacebookIcon(props: IconProps) {
	return (
		<svg viewBox="0 0 24 24" {...defaults} {...props}>
			<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
		</svg>
	);
}

export function TikTokIcon(props: IconProps) {
	return (
		<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
			<path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
		</svg>
	);
}

export type SocialId = "instagram" | "facebook" | "tiktok";

export function SocialIcon({
	id,
	className,
}: {
	id: SocialId;
	className?: string;
}) {
	if (id === "instagram") return <InstagramIcon className={className} />;
	if (id === "facebook") return <FacebookIcon className={className} />;
	return <TikTokIcon className={className} />;
}

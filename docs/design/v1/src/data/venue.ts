export const VENUE = {
  name: "Bar of Legends",
  city: "Győr",
  email: "baroflegendsgyor@gmail.com",
  // Placeholder phone number for the prototype — not a real line.
  phone: "+36961234567",
  phoneDisplay: "+36 96 123 4567",
  // Street-level coordinates for Szabadsajtó utca, Győr (via OSM) — prototype placeholder.
  lat: 47.6877,
  lng: 17.6326,
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Bar%20of%20Legends%2C%20Szabadsajt%C3%B3%20utca%202%2C%20Gy%C5%91r",
  mailtoBooking: `mailto:baroflegendsgyor@gmail.com?subject=${encodeURIComponent("Table booking — Bar of Legends")}`,
  mailtoEvent: `mailto:baroflegendsgyor@gmail.com?subject=${encodeURIComponent("Event enquiry — Bar of Legends")}`,
} as const;

export type SocialId = "instagram" | "facebook" | "tiktok";

export const SOCIALS: Array<{ id: SocialId; href: string }> = [
  { id: "instagram", href: "#" },
  { id: "facebook", href: "#" },
  { id: "tiktok", href: "#" },
];

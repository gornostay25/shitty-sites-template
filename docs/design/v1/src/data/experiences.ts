import type { Locale } from "./i18n/config";

export type ExperienceCategory = "gaming" | "social" | "events";

export type Experience = {
  id: string;
  category: ExperienceCategory;
  image: string;
  /** Which kind of CTA the card carries: phone booking, email booking, or ask at the bar */
  cta: "tel" | "mailto" | "ask";
  title: Record<Locale, string>;
  desc: Record<Locale, string>;
  meta: Record<Locale, string>;
};

export const EXPERIENCES: Experience[] = [
  {
    id: "pc-ps5-stations",
    category: "gaming",
    image: "/placeholders/pc-setup.png",
    cta: "tel",
    title: {
      en: "PC & PS5 Gaming Stations",
      hu: "PC és PS5 játékállomások",
      de: "PC- & PS5-Gaming-Stationen",
    },
    desc: {
      en: "Book a battlestation: high-spec gaming PCs with 144 Hz monitors or a PS5 couch corner with a big-screen TV. Solo queue or full lobby — drinks delivered to your desk.",
      hu: "Foglalj harcállomást: csúcskategoriás gépek 144 Hz-es monitorokkal vagy PS5-es kanapés sarok nagy tévével. Egyedül vagy teljes csapattal — az italok asztalhoz mennek.",
      de: "Buch deine Battlestation: High-End-Gaming-PCs mit 144-Hz-Monitoren oder eine PS5-Couch-Ecke mit großem TV. Solo oder mit dem ganzen Squad — Getränke kommen an den Platz.",
    },
    meta: {
      en: "From 1 hour · 1–6 players",
      hu: "1 órától · 1–6 játékos",
      de: "Ab 1 Stunde · 1–6 Spieler",
    },
  },
  {
    id: "board-game-library",
    category: "social",
    image: "/placeholders/boardgames.png",
    cta: "ask",
    title: {
      en: "Board Game Library",
      hu: "Társasjáték-kínálat",
      de: "Brettspielsammlung",
    },
    desc: {
      en: "Eighty-plus titles on the shelf — from Catan to Codenames. Grab one off the shelf or have the bar teach the table. Free to play while you drink.",
      hu: "Nyolcvanféle játék a polcon — a Catan-tól a Codenames-ig. Vedd le a polcról, vagy hagyd, hogy a pultos megtanítsa. Fogyasztás mellett ingyen játszható.",
      de: "Über achtzig Titel im Regal — von Catan bis Codenames. Nimm dir ein Spiel oder lass es dir von der Bar erklären. Bei einem Getränk gratis spielbar.",
    },
    meta: {
      en: "80+ titles · 2–8 players · free",
      hu: "80+ játék · 2–8 fő · ingyen",
      de: "80+ Spiele · 2–8 Personen · gratis",
    },
  },
  {
    id: "weekly-pub-quiz",
    category: "events",
    image: "/placeholders/quiz.png",
    cta: "tel",
    title: {
      en: "Weekly Pub Quiz",
      hu: "Heti pubkvíz",
      de: "Wöchentliches Pub Quiz",
    },
    desc: {
      en: "Every Thursday at 8 PM: five rounds of trivia with music and picture rounds. Teams of up to six, a bar tab for the winners, bragging rights for the month.",
      hu: "Minden csütörtökön 20:00-kor: öt kör ismeretterjesztő kérdésekkel, zenei és képes körökkel. Csapatok legfeljebb hat főig, a győzteseknek italszámla, egy hónapra szóló dicsőség.",
      de: "Jeden Donnerstag um 20 Uhr: fünf Wissensrunden mit Musik- und Bildrunden. Teams bis sechs Personen, ein Laufzettel für die Gewinner — und ein Monat Bragging Rights.",
    },
    meta: {
      en: "Thursdays · 8:00 PM · teams of 2–6",
      hu: "Csütörtökönként · 20:00 · 2–6 fős csapatok",
      de: "Donnerstags · 20:00 Uhr · Teams von 2–6",
    },
  },
  {
    id: "foosball-darts",
    category: "social",
    image: "/placeholders/foosball.png",
    cta: "ask",
    title: {
      en: "Foosball & Darts",
      hu: "Csocsó és darts",
      de: "Tischkicker & Dart",
    },
    desc: {
      en: "Two foosball tables and a proper steel-tip dart corner. Winner stays on, loser buys the next round. Free to play, always.",
      hu: "Két csocsóasztal és egy igazi acélhegyes darts sarok. A győztes marad, a vesztes fizet egy kört. Ingyen, mindig.",
      de: "Zwei Kicker und eine echte Steeldart-Ecke. Der Sieger bleibt stehen, der Verlierer zahlt die nächste Runde. Immer gratis.",
    },
    meta: {
      en: "Free with any drink · 2–4 players",
      hu: "Fogyasztással ingyen · 2–4 fő",
      de: "Mit Getränk gratis · 2–4 Personen",
    },
  },
  {
    id: "private-events",
    category: "events",
    image: "/placeholders/party.png",
    cta: "mailto",
    title: {
      en: "Private Events & Party Booking",
      hu: "Privát rendezvények, bulik",
      de: "Private Events & Partybuchung",
    },
    desc: {
      en: "Birthdays, team nights, bachelor parties or a full-bar buyout: tell us the headcount and the vibe, and we'll handle tables, setups and the playlist.",
      hu: "Szülinapok, céges estek, legénybúcsúk vagy a teljes bár kibérlése: mondd meg a létszámot és a hangulatot, a többi ránk vár.",
      de: "Geburtstage, Teamevents, Junggesellenabschiede oder eine komplette Bar: Sag uns die Personenzahl und die Stimmung — den Rest übernehmen wir.",
    },
    meta: {
      en: "10–80 guests · book 1+ week ahead",
      hu: "10–80 fő · foglalás 1 héttel előre",
      de: "10–80 Gäste · Buchung 1+ Woche im Voraus",
    },
  },
  {
    id: "tournaments-watchparties",
    category: "gaming",
    image: "/placeholders/tournament.png",
    cta: "tel",
    title: {
      en: "Console Tournaments & Watch Parties",
      hu: "Konzoltornák és nézőestek",
      de: "Konsolen-Turniere & Watchpartys",
    },
    desc: {
      en: "FIFA and Tekken brackets on the big screen, plus live watch parties for the biggest esports finals — with drink specials on the big nights.",
      hu: "FIFA- és Tekken-küzdelmek a nagyvásznon, valamint közös nézőestek a legnagyobb esport-döntőkön — a nagy napokon italkülönlegességekkel.",
      de: "FIFA- und Tekken-Brackets auf der großen Leinwand, dazu Live-Viewings der größten Esport-Finals — an den großen Abenden mit Getränkespecials.",
    },
    meta: {
      en: "Monthly brackets · finals on the big screen",
      hu: "Havi tornák · döntők a nagyvásznon",
      de: "Monatliche Turniere · Finals auf der Leinwand",
    },
  },
];

export type LocalizedExperience = {
  id: string;
  category: ExperienceCategory;
  image: string;
  cta: Experience["cta"];
  title: string;
  desc: string;
  meta: string;
};

export function getExperiences(locale: Locale): LocalizedExperience[] {
  return EXPERIENCES.map((exp) => ({
    id: exp.id,
    category: exp.category,
    image: exp.image,
    cta: exp.cta,
    title: exp.title[locale],
    desc: exp.desc[locale],
    meta: exp.meta[locale],
  }));
}

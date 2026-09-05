import type { Locale } from "./i18n/config";

export type GalleryItem = {
  src: string;
  /** Tailwind span classes for the bento grid (mobile 2-col + desktop 4-col) */
  className: string;
  alt: Record<Locale, string>;
};

export const GALLERY: GalleryItem[] = [
  {
    src: "/placeholders/crowd.png",
    className: "col-span-2 row-span-2",
    alt: {
      en: "Friends toasting craft beer at the bar",
      hu: "Barátok koccintanak kézműves sörrel a bárban",
      de: "Freunde stoßen mit Craftbier an der Bar an",
    },
  },
  {
    src: "/placeholders/beer-pour.png",
    className: "row-span-2",
    alt: {
      en: "Craft beer poured fresh from the tap",
      hu: "Frissen csapolt kézműves sör",
      de: "Frisch gezapftes Craftbier",
    },
  },
  {
    src: "/placeholders/cocktail.png",
    className: "",
    alt: {
      en: "Signature cocktail with orange peel",
      hu: "Signature koktél narancshéjjal",
      de: "Signature-Cocktail mit Orangenzeste",
    },
  },
  {
    src: "/placeholders/quiz.png",
    className: "",
    alt: {
      en: "Pub quiz teams deep in thought",
      hu: "Pubkvízes csapatok gondolkodnak",
      de: "Pub-Quiz-Teams beim Grübeln",
    },
  },
  {
    src: "/placeholders/pc-setup.png",
    className: "col-span-2",
    alt: {
      en: "Row of high-spec gaming PCs",
      hu: "Csúcskategoriás játékgépek sorban",
      de: "Reihe hochwertiger Gaming-PCs",
    },
  },
  {
    src: "/placeholders/ps5.png",
    className: "",
    alt: {
      en: "Console lounge with big screen",
      hu: "Konzolsarok nagy tévével",
      de: "Konsolen-Lounge mit großem TV",
    },
  },
  {
    src: "/placeholders/foosball.png",
    className: "",
    alt: {
      en: "Foosball table under amber light",
      hu: "Csocsóasztal borostyán fényben",
      de: "Tischkicker im Bernsteinlicht",
    },
  },
  {
    src: "/placeholders/party.png",
    className: "col-span-2",
    alt: {
      en: "Birthday sparkler at a private table",
      hu: "Szülinapi szikragyújtás egy privát asztalnál",
      de: "Geburtstagswunderkerze am privaten Tisch",
    },
  },
  {
    src: "/placeholders/boardgames.png",
    className: "",
    alt: {
      en: "Board game night with beers",
      hu: "Társasjáték-est sörökkel",
      de: "Brettspielabend mit Bier",
    },
  },
  {
    src: "/placeholders/darts.png",
    className: "",
    alt: {
      en: "Dartboard corner",
      hu: "Darts sarok",
      de: "Dart-Ecke",
    },
  },
  {
    src: "/placeholders/tournament.png",
    className: "col-span-2",
    alt: {
      en: "Esports final on the big screen",
      hu: "Esport-döntő a nagyvásznon",
      de: "Esport-Finale auf der großen Leinwand",
    },
  },
  {
    src: "/placeholders/cocktail-two.png",
    className: "col-span-2",
    alt: {
      en: "House sour cocktail in coupe glass",
      hu: "Házi sour koktél pohárban",
      de: "Haus-Sour im Coupé-Glas",
    },
  },
];

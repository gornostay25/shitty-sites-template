import type { Locale } from "./i18n/config";

export type MenuCategory = "alcoholic" | "nonalcoholic" | "snacks";

export type MenuItem = {
  id: string;
  category: MenuCategory;
  image: string;
  price: number;
  name: Record<Locale, string>;
  desc: Record<Locale, string>;
};

export const MENU: MenuItem[] = [
  // ——— Alcoholic ———
  {
    id: "vaskakas-ipa",
    category: "alcoholic",
    image: "/placeholders/beer-pour.png",
    price: 2490,
    name: { en: "Vaskakas IPA", hu: "Vaskakas IPA", de: "Vaskakas IPA" },
    desc: {
      en: "Hazy, hop-forward IPA from Győr's own Vaskakas craft brewery, poured fresh from the tap.",
      hu: "Komlós, gyümölcsös IPA a győri Vaskakas kézműves főzdéből, frissen csapolt.",
      de: "Fruchtig-komloses IPA aus der Győrer Vaskakas-Brauerei, frisch vom Fass.",
    },
  },
  {
    id: "vaskakas-lager",
    category: "alcoholic",
    image: "/placeholders/beer-two.png",
    price: 1990,
    name: { en: "Vaskakas Craft Lager", hu: "Vaskakas Lager", de: "Vaskakas Craft-Lager" },
    desc: {
      en: "Crisp golden lager — the easy house favourite for round one.",
      hu: "Könnyed, aranyló lager — a ház kedvence az első körre.",
      de: "Knackiges, goldgelbes Lager — der leichte Hausklassiker für die erste Runde.",
    },
  },
  {
    id: "bartenders-choice",
    category: "alcoholic",
    image: "/placeholders/cocktail.png",
    price: 3490,
    name: {
      en: "Bartender's Choice",
      hu: "A bárpultos választása",
      de: "Cocktail des Bartenders",
    },
    desc: {
      en: "Rotating signature mix from Hungary's Bartender of the Year — ask what's shaking tonight.",
      hu: "Változó signature koktél az év bartendere mixtúrájában — kérdezd meg, mi készül ma este.",
      de: "Wechselnde Signature-Kreation des Barkeepers des Jahres — frag nach, was heute gemixt wird.",
    },
  },
  {
    id: "legend-sour",
    category: "alcoholic",
    image: "/placeholders/cocktail-two.png",
    price: 3290,
    name: { en: "Legend Sour", hu: "Legend Sour", de: "Legend Sour" },
    desc: {
      en: "House sour with whisky, fresh lemon and a whisper of smoke.",
      hu: "Házi sour whiskyvel, friss citrommal és egy csipet füsttel.",
      de: "Haus-Sour mit Whisky, frischer Zitrone und einer Prise Rauch.",
    },
  },
  {
    id: "aperol-spritz",
    category: "alcoholic",
    image: "/placeholders/spritz.png",
    price: 2790,
    name: { en: "Aperol Spritz", hu: "Aperol Spritz", de: "Aperol Spritz" },
    desc: {
      en: "The aperitivo classic — prosecco, Aperol, soda and orange.",
      hu: "A klasszikus aperitivo — prosecco, Aperol, szóda és narancs.",
      de: "Der Aperitivo-Klassiker — Prosecco, Aperol, Soda und Orange.",
    },
  },
  {
    id: "wine-by-the-glass",
    category: "alcoholic",
    image: "/placeholders/wine.png",
    price: 1890,
    name: {
      en: "Hungarian Wine by the Glass",
      hu: "Magyar bor pohárban",
      de: "Ungarischer Wein im Glas",
    },
    desc: {
      en: "Rotating pours from Hungarian wineries — ask for tonight's open bottle.",
      hu: "Változó kínálat magyar borászatokból — kérdezd meg a mai nyitott palackot.",
      de: "Wechselnde Ausschänke ungarischer Winzer — frag nach dem heutigen offenen Glas.",
    },
  },
  // ——— Non-alcoholic ———
  {
    id: "house-lemonade",
    category: "nonalcoholic",
    image: "/placeholders/lemonade.png",
    price: 1590,
    name: { en: "House Lemonade", hu: "Házi limonádé", de: "Hauslimonade" },
    desc: {
      en: "Pressed to order — raspberry, elderflower or lemon-ginger.",
      hu: "Frissen facsarva — málnás, bodzás vagy citromos-gyömbéres.",
      de: "Frisch gepresst — Himbeere, Holunderblüte oder Zitrone-Ingwer.",
    },
  },
  {
    id: "cold-brew",
    category: "nonalcoholic",
    image: "/placeholders/coffee.png",
    price: 1290,
    name: { en: "Cold Brew Coffee", hu: "Cold brew kávé", de: "Cold Brew" },
    desc: {
      en: "Slow-steeped iced coffee over ice with orange zest.",
      hu: "Lassan áztatott jeges kávé narancshéjjal.",
      de: "Lang gezogener Eiskaffee mit Orangenzeste.",
    },
  },
  {
    id: "vaskakas-zero",
    category: "nonalcoholic",
    image: "/placeholders/beer-two.png",
    price: 1690,
    name: { en: "Vaskakas 0.0", hu: "Vaskakas 0.0", de: "Vaskakas 0.0" },
    desc: {
      en: "The house craft beer, minus the alcohol. Full flavour, zero regrets.",
      hu: "A házi kézműves sör alkoholmentesen — teljes íz, nulla lemondás.",
      de: "Das Hausbier ohne Alkohol — voller Geschmack, null Reue.",
    },
  },
  {
    id: "ginger-fizz",
    category: "nonalcoholic",
    image: "/placeholders/cocktail-two.png",
    price: 1390,
    name: { en: "Ginger Fizz", hu: "Ginger Fizz", de: "Ginger Fizz" },
    desc: {
      en: "House ginger syrup, lime and soda — sharp and refreshing.",
      hu: "Házi gyömbérszirup, lime és szóda — csípős és frissítő.",
      de: "Hausgemachter Ingwersirup mit Limette und Soda — scharf und erfrischend.",
    },
  },
  {
    id: "energy-drinks",
    category: "nonalcoholic",
    image: "/placeholders/softdrinks.png",
    price: 1490,
    name: { en: "Energy Drinks", hu: "Energiaitalok", de: "Energydrinks" },
    desc: {
      en: "Red Bull & co. to keep the lobby running past midnight.",
      hu: "Red Bull és társai, hogy a menet hajnaliig menjen.",
      de: "Red Bull & Co., damit das Match bis nach Mitternacht läuft.",
    },
  },
  {
    id: "sodas-juices",
    category: "nonalcoholic",
    image: "/placeholders/cola.png",
    price: 990,
    name: { en: "Sodas & Juices", hu: "Üdítők és gyümölcslevek", de: "Softdrinks & Säfte" },
    desc: {
      en: "The classics, ice cold — cola, sprites, orange, apple.",
      hu: "A klasszikusok jéghidegen — kóla, fröccs, narancs, alma.",
      de: "Die Klassiker, eiskalt — Cola, Sprudel, Orange, Apfel.",
    },
  },
  // ——— Snacks ———
  {
    id: "loaded-fries",
    category: "snacks",
    image: "/placeholders/fries.png",
    price: 2490,
    name: { en: "Legend Loaded Fries", hu: "Legend rakott hasábok", de: "Legend Loaded Fries" },
    desc: {
      en: "Double-fried fries, cheese sauce, crispy bacon, jalapeño.",
      hu: "Kétszer sütött hasábok, sajtszósz, ropogós szalonna, jalapeño.",
      de: "Doppelt frittierte Pommes, Käsesauce, knuspriger Speck, Jalapeño.",
    },
  },
  {
    id: "buffalo-wings",
    category: "snacks",
    image: "/placeholders/wings.png",
    price: 2990,
    name: { en: "Buffalo Wings (6 pcs)", hu: "Buffalos szárnyak (6 db)", de: "Buffalo Wings (6 Stück)" },
    desc: {
      en: "Crispy wings tossed in house buffalo sauce, with blue cheese dip.",
      hu: "Ropogós szárnyak házi buffalos szószban, kék sajtos mártogatóval.",
      de: "Knusprige Flügel in hausgemachter Buffalo-Sauce, dazu Blue-Cheese-Dip.",
    },
  },
  {
    id: "bar-nachos",
    category: "snacks",
    image: "/placeholders/nachos.png",
    price: 2790,
    name: { en: "Bar Nachos", hu: "Bárnachos", de: "Bar-Nachos" },
    desc: {
      en: "Tortilla chips, melted cheese, salsa and sour cream — built for sharing.",
      hu: "Tortillachips, olvadt sajt, salsa és tejföl — megosztásra tervezve.",
      de: "Tortillachips, geschmolzener Käse, Salsa und Sour Cream — zum Teilen.",
    },
  },
  {
    id: "onion-rings",
    category: "snacks",
    image: "/placeholders/rings.png",
    price: 1690,
    name: { en: "Onion Rings", hu: "Hagymakarikák", de: "Onion Rings" },
    desc: {
      en: "Golden, crunchy rings with smoked paprika mayo.",
      hu: "Arany, ropogós karikák füstölt paprikás majonézzel.",
      de: "Goldgelbe, knusprige Ringe mit Paprika-Mayo.",
    },
  },
  {
    id: "pretzel-dip",
    category: "snacks",
    image: "/placeholders/pretzel.png",
    price: 1390,
    name: { en: "Pretzel & Cheese Dip", hu: "Stangli & sajtmártás", de: "Laugenstange & Käsedip" },
    desc: {
      en: "Bavarian-style pretzel with warm beer-cheese dip.",
      hu: "Bajor stangli meleg sörös sajtmártással.",
      de: "Laugenstange nach bayerischer Art mit warmem Bier-Käse-Dip.",
    },
  },
  {
    id: "squad-platter",
    category: "snacks",
    image: "/placeholders/platter.png",
    price: 4990,
    name: { en: "The Squad Platter", hu: "A csapat tála", de: "Die Squad-Platte" },
    desc: {
      en: "Wings, fries, rings and nachos on one tray — feeds 2–3 legends.",
      hu: "Szárnyak, hasábok, hagymakarikák és nachos egy tálon — 2–3 legendának elég.",
      de: "Wings, Pommes, Ringe und Nachos auf einem Blech — reicht für 2–3 Legenden.",
    },
  },
];

export type LocalizedMenuItem = {
  id: string;
  image: string;
  price: number;
  name: string;
  desc: string;
};

export function getMenuByCategory(locale: Locale): Record<MenuCategory, LocalizedMenuItem[]> {
  const pick = (items: MenuItem[]) =>
    items.map((item) => ({
      id: item.id,
      image: item.image,
      price: item.price,
      name: item.name[locale],
      desc: item.desc[locale],
    }));

  return {
    alcoholic: pick(MENU.filter((i) => i.category === "alcoholic")),
    nonalcoholic: pick(MENU.filter((i) => i.category === "nonalcoholic")),
    snacks: pick(MENU.filter((i) => i.category === "snacks")),
  };
}

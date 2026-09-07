/**
 * Generates seed/seed.json BOL content from prototype data.
 * Run: bun scripts/generate-bol-seed.ts
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import {
	DEFAULT_EXPERIENCE_CATEGORIES,
	DEFAULT_MENU_CATEGORIES,
} from "../src/plugins/bol-theme/types/taxonomies.ts";

type Locale = "en" | "hu" | "de";

const MENU_IMAGE: Record<string, string> = {
	"vaskakas-ipa": "beer-pour.webp",
	"vaskakas-lager": "beer-two.webp",
	"bartenders-choice": "cocktail.webp",
	"legend-sour": "cocktail-two.webp",
	"aperol-spritz": "spritz.webp",
	"wine-by-the-glass": "wine.webp",
	"house-lemonade": "lemonade.webp",
	"cold-brew": "coffee.webp",
	"vaskakas-zero": "beer-two.webp",
	"ginger-fizz": "cocktail-two.webp",
	"energy-drinks": "softdrinks.webp",
	"sodas-juices": "cola.webp",
	"loaded-fries": "fries.webp",
	"buffalo-wings": "wings.webp",
	"bar-nachos": "platter.webp",
	"onion-rings": "fries.webp",
	"pretzel-dip": "pretzel.webp",
	"squad-platter": "platter.webp",
};

const MENU_ITEMS: Array<{
	id: string;
	category: (typeof DEFAULT_MENU_CATEGORIES)[number];
	price: number;
	sort_order: number;
	name: Record<Locale, string>;
	description: Record<Locale, string>;
}> = [
	{
		id: "vaskakas-ipa",
		category: "alcoholic",
		price: 2490,
		sort_order: 1,
		name: { en: "Vaskakas IPA", hu: "Vaskakas IPA", de: "Vaskakas IPA" },
		description: {
			en: "Hazy, hop-forward IPA from Győr's own Vaskakas craft brewery, poured fresh from the tap.",
			hu: "Komlós, gyümölcsös IPA a győri Vaskakas kézműves főzdéből, frissen csapolt.",
			de: "Fruchtig-komloses IPA aus der Győrer Vaskakas-Brauerei, frisch vom Fass.",
		},
	},
	{
		id: "vaskakas-lager",
		category: "alcoholic",
		price: 1990,
		sort_order: 2,
		name: {
			en: "Vaskakas Craft Lager",
			hu: "Vaskakas Lager",
			de: "Vaskakas Craft-Lager",
		},
		description: {
			en: "Crisp golden lager — the easy house favourite for round one.",
			hu: "Könnyed, aranyló lager — a ház kedvence az első körre.",
			de: "Knackiges, goldgelbes Lager — der leichte Hausklassiker für die erste Runde.",
		},
	},
	{
		id: "bartenders-choice",
		category: "alcoholic",
		price: 3490,
		sort_order: 3,
		name: {
			en: "Bartender's Choice",
			hu: "A bárpultos választása",
			de: "Cocktail des Bartenders",
		},
		description: {
			en: "Rotating signature mix from Hungary's Bartender of the Year — ask what's shaking tonight.",
			hu: "Változó signature koktél az év bartendere mixtúrájában — kérdezd meg, mi készül ma este.",
			de: "Wechselnde Signature-Kreation des Barkeepers des Jahres — frag nach, was heute gemixt wird.",
		},
	},
	{
		id: "legend-sour",
		category: "alcoholic",
		price: 3290,
		sort_order: 4,
		name: { en: "Legend Sour", hu: "Legend Sour", de: "Legend Sour" },
		description: {
			en: "House sour with whisky, fresh lemon and a whisper of smoke.",
			hu: "Házi sour whiskyvel, friss citrommal és egy csipet füsttel.",
			de: "Haus-Sour mit Whisky, frischer Zitrone und einer Prise Rauch.",
		},
	},
	{
		id: "aperol-spritz",
		category: "alcoholic",
		price: 2790,
		sort_order: 5,
		name: { en: "Aperol Spritz", hu: "Aperol Spritz", de: "Aperol Spritz" },
		description: {
			en: "The aperitivo classic — prosecco, Aperol, soda and orange.",
			hu: "A klasszikus aperitivo — prosecco, Aperol, szóda és narancs.",
			de: "Der Aperitivo-Klassiker — Prosecco, Aperol, Soda und Orange.",
		},
	},
	{
		id: "wine-by-the-glass",
		category: "alcoholic",
		price: 1890,
		sort_order: 6,
		name: {
			en: "Hungarian Wine by the Glass",
			hu: "Magyar bor pohárban",
			de: "Ungarischer Wein im Glas",
		},
		description: {
			en: "Rotating pours from Hungarian wineries — ask for tonight's open bottle.",
			hu: "Változó kínálat magyar borászatokból — kérdezd meg a mai nyitott palackot.",
			de: "Wechselnde Ausschänke ungarischer Winzer — frag nach dem heutigen offenen Glas.",
		},
	},
	{
		id: "house-lemonade",
		category: "nonalcoholic",
		price: 1590,
		sort_order: 7,
		name: { en: "House Lemonade", hu: "Házi limonádé", de: "Hauslimonade" },
		description: {
			en: "Pressed to order — raspberry, elderflower or lemon-ginger.",
			hu: "Frissen facsarva — málnás, bodzás vagy citromos-gyömbéres.",
			de: "Frisch gepresst — Himbeere, Holunderblüte oder Zitrone-Ingwer.",
		},
	},
	{
		id: "cold-brew",
		category: "nonalcoholic",
		price: 1290,
		sort_order: 8,
		name: { en: "Cold Brew Coffee", hu: "Cold brew kávé", de: "Cold Brew" },
		description: {
			en: "Slow-steeped iced coffee over ice with orange zest.",
			hu: "Lassan áztatott jeges kávé narancshéjjal.",
			de: "Lang gezogener Eiskaffee mit Orangenzeste.",
		},
	},
	{
		id: "vaskakas-zero",
		category: "nonalcoholic",
		price: 1690,
		sort_order: 9,
		name: { en: "Vaskakas 0.0", hu: "Vaskakas 0.0", de: "Vaskakas 0.0" },
		description: {
			en: "The house craft beer, minus the alcohol. Full flavour, zero regrets.",
			hu: "A házi kézműves sör alkoholmentesen — teljes íz, nulla lemondás.",
			de: "Das Hausbier ohne Alkohol — voller Geschmack, null Reue.",
		},
	},
	{
		id: "ginger-fizz",
		category: "nonalcoholic",
		price: 1390,
		sort_order: 10,
		name: { en: "Ginger Fizz", hu: "Ginger Fizz", de: "Ginger Fizz" },
		description: {
			en: "House ginger syrup, lime and soda — sharp and refreshing.",
			hu: "Házi gyömbérszirup, lime és szóda — csípős és frissítő.",
			de: "Hausgemachter Ingwersirup mit Limette und Soda — scharf und erfrischend.",
		},
	},
	{
		id: "energy-drinks",
		category: "nonalcoholic",
		price: 1490,
		sort_order: 11,
		name: { en: "Energy Drinks", hu: "Energiaitalok", de: "Energydrinks" },
		description: {
			en: "Red Bull & co. to keep the lobby running past midnight.",
			hu: "Red Bull és társai, hogy a menet hajnaliig menjen.",
			de: "Red Bull & Co., damit das Match bis nach Mitternacht läuft.",
		},
	},
	{
		id: "sodas-juices",
		category: "nonalcoholic",
		price: 990,
		sort_order: 12,
		name: {
			en: "Sodas & Juices",
			hu: "Üdítők és gyümölcslevek",
			de: "Softdrinks & Säfte",
		},
		description: {
			en: "The classics, ice cold — cola, sprites, orange, apple.",
			hu: "A klasszikusok jéghidegen — kóla, fröccs, narancs, alma.",
			de: "Die Klassiker, eiskalt — Cola, Sprudel, Orange, Apfel.",
		},
	},
	{
		id: "loaded-fries",
		category: "snacks",
		price: 2490,
		sort_order: 13,
		name: {
			en: "Legend Loaded Fries",
			hu: "Legend rakott hasábok",
			de: "Legend Loaded Fries",
		},
		description: {
			en: "Double-fried fries, cheese sauce, crispy bacon, jalapeño.",
			hu: "Kétszer sütött hasábok, sajtszósz, ropogós szalonna, jalapeño.",
			de: "Doppelt frittierte Pommes, Käsesauce, knuspriger Speck, Jalapeño.",
		},
	},
	{
		id: "buffalo-wings",
		category: "snacks",
		price: 2990,
		sort_order: 14,
		name: {
			en: "Buffalo Wings (6 pcs)",
			hu: "Buffalos szárnyak (6 db)",
			de: "Buffalo Wings (6 Stück)",
		},
		description: {
			en: "Crispy wings tossed in house buffalo sauce, with blue cheese dip.",
			hu: "Ropogós szárnyak házi buffalos szószban, kék sajtos mártogatóval.",
			de: "Knusprige Flügel in hausgemachter Buffalo-Sauce, dazu Blue-Cheese-Dip.",
		},
	},
	{
		id: "bar-nachos",
		category: "snacks",
		price: 2790,
		sort_order: 15,
		name: { en: "Bar Nachos", hu: "Bárnachos", de: "Bar-Nachos" },
		description: {
			en: "Tortilla chips, melted cheese, salsa and sour cream — built for sharing.",
			hu: "Tortillachips, olvadt sajt, salsa és tejföl — megosztásra tervezve.",
			de: "Tortillachips, geschmolzener Käse, Salsa und Sour Cream — zum Teilen.",
		},
	},
	{
		id: "onion-rings",
		category: "snacks",
		price: 1690,
		sort_order: 16,
		name: { en: "Onion Rings", hu: "Hagymakarikák", de: "Onion Rings" },
		description: {
			en: "Golden, crunchy rings with smoked paprika mayo.",
			hu: "Arany, ropogós karikák füstölt paprikás majonézzel.",
			de: "Goldgelbe, knusprige Ringe mit Paprika-Mayo.",
		},
	},
	{
		id: "pretzel-dip",
		category: "snacks",
		price: 1390,
		sort_order: 17,
		name: {
			en: "Pretzel & Cheese Dip",
			hu: "Stangli & sajtmártás",
			de: "Laugenstange & Käsedip",
		},
		description: {
			en: "Bavarian-style pretzel with warm beer-cheese dip.",
			hu: "Bajor stangli meleg sörös sajtmártással.",
			de: "Laugenstange nach bayerischer Art mit warmem Bier-Käse-Dip.",
		},
	},
	{
		id: "squad-platter",
		category: "snacks",
		price: 4990,
		sort_order: 18,
		name: {
			en: "The Squad Platter",
			hu: "A csapat tála",
			de: "Die Squad-Platte",
		},
		description: {
			en: "Wings, fries, rings and nachos on one tray — feeds 2–3 legends.",
			hu: "Szárnyak, hasábok, hagymakarikák és nachos egy tálon — 2–3 legendának elég.",
			de: "Wings, Pommes, Ringe und Nachos auf einem Blech — reicht für 2–3 Legenden.",
		},
	},
];

const EXPERIENCES: Array<{
	id: string;
	category: (typeof DEFAULT_EXPERIENCE_CATEGORIES)[number];
	cta_type: "tel" | "mailto" | "ask";
	sort_order: number;
	image: string;
	title: Record<Locale, string>;
	description: Record<Locale, string>;
	meta: Record<Locale, string>;
}> = [
	{
		id: "pc-ps5-stations",
		category: "gaming",
		cta_type: "tel",
		sort_order: 1,
		image: "pc-setup.webp",
		title: {
			en: "PC & PS5 Gaming Stations",
			hu: "PC és PS5 játékállomások",
			de: "PC- & PS5-Gaming-Stationen",
		},
		description: {
			en: "Book a battlestation: high-spec gaming PCs with 144 Hz monitors or a PS5 couch corner with a big-screen TV.",
			hu: "Foglalj harcállomást: csúcskategoriás gépek 144 Hz-es monitorokkal vagy PS5-es kanapés sarok nagy tévével.",
			de: "Buch deine Battlestation: High-End-Gaming-PCs mit 144-Hz-Monitoren oder eine PS5-Couch-Ecke mit großem TV.",
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
		cta_type: "ask",
		sort_order: 2,
		image: "boardgames.webp",
		title: {
			en: "Board Game Library",
			hu: "Társasjáték-kínálat",
			de: "Brettspielsammlung",
		},
		description: {
			en: "Eighty-plus titles on the shelf — from Catan to Codenames. Free to play while you drink.",
			hu: "Nyolcvanféle játék a polcon — a Catan-tól a Codenames-ig. Fogyasztás mellett ingyen játszható.",
			de: "Über achtzig Titel im Regal — von Catan bis Codenames. Bei einem Getränk gratis spielbar.",
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
		cta_type: "tel",
		sort_order: 3,
		image: "quiz.webp",
		title: {
			en: "Weekly Pub Quiz",
			hu: "Heti pubkvíz",
			de: "Wöchentliches Pub Quiz",
		},
		description: {
			en: "Every Thursday at 8 PM: five rounds of trivia with music and picture rounds.",
			hu: "Minden csütörtökön 20:00-kor: öt kör ismeretterjesztő kérdésekkel, zenei és képes körökkel.",
			de: "Jeden Donnerstag um 20 Uhr: fünf Wissensrunden mit Musik- und Bildrunden.",
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
		cta_type: "ask",
		sort_order: 4,
		image: "foosball.webp",
		title: {
			en: "Foosball & Darts",
			hu: "Csocsó és darts",
			de: "Tischkicker & Dart",
		},
		description: {
			en: "Two foosball tables and a proper steel-tip dart corner. Winner stays on, loser buys the next round.",
			hu: "Két csocsóasztal és egy igazi acélhegyes darts sarok. A győztes marad, a vesztes fizet egy kört.",
			de: "Zwei Kicker und eine echte Steeldart-Ecke. Der Sieger bleibt stehen, der Verlierer zahlt die nächste Runde.",
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
		cta_type: "mailto",
		sort_order: 5,
		image: "party.webp",
		title: {
			en: "Private Events & Party Booking",
			hu: "Privát rendezvények, bulik",
			de: "Private Events & Partybuchung",
		},
		description: {
			en: "Birthdays, team nights, bachelor parties or a full-bar buyout — tell us the headcount and the vibe.",
			hu: "Szülinapok, céges estek, legénybúcsúk vagy a teljes bár kibérlése: mondd meg a létszámot és a hangulatot.",
			de: "Geburtstage, Teamevents, Junggesellenabschiede oder eine komplette Bar — sag uns die Personenzahl und die Stimmung.",
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
		cta_type: "tel",
		sort_order: 6,
		image: "tournament.webp",
		title: {
			en: "Console Tournaments & Watch Parties",
			hu: "Konzoltornák és nézőestek",
			de: "Konsolen-Turniere & Watchpartys",
		},
		description: {
			en: "FIFA and Tekken brackets on the big screen, plus live watch parties for the biggest esports finals.",
			hu: "FIFA- és Tekken-küzdelmek a nagyvásznon, valamint közös nézőestek a legnagyobb esport-döntőkön.",
			de: "FIFA- und Tekken-Brackets auf der großen Leinwand, dazu Live-Viewings der größten Esport-Finals.",
		},
		meta: {
			en: "Monthly brackets · finals on the big screen",
			hu: "Havi tornák · döntők a nagyvásznon",
			de: "Monatliche Turniere · Finals auf der Leinwand",
		},
	},
];

const GALLERY: Array<{
	id: string;
	file: string;
	grid_span: string;
	sort_order: number;
	alt: Record<Locale, string>;
}> = [
	{
		id: "crowd",
		file: "crowd.webp",
		grid_span: "col-2-row-2",
		sort_order: 1,
		alt: {
			en: "Friends toasting craft beer at the bar",
			hu: "Barátok koccintanak kézműves sörrel a bárban",
			de: "Freunde stoßen mit Craftbier an der Bar an",
		},
	},
	{
		id: "beer-pour",
		file: "beer-pour.webp",
		grid_span: "row-2",
		sort_order: 2,
		alt: {
			en: "Craft beer poured fresh from the tap",
			hu: "Frissen csapolt kézműves sör",
			de: "Frisch gezapftes Craftbier",
		},
	},
	{
		id: "cocktail",
		file: "cocktail.webp",
		grid_span: "default",
		sort_order: 3,
		alt: {
			en: "Signature cocktail with orange peel",
			hu: "Signature koktél narancshéjjal",
			de: "Signature-Cocktail mit Orangenzeste",
		},
	},
	{
		id: "quiz",
		file: "quiz.webp",
		grid_span: "default",
		sort_order: 4,
		alt: {
			en: "Pub quiz teams deep in thought",
			hu: "Pubkvízes csapatok gondolkodnak",
			de: "Pub-Quiz-Teams beim Grübeln",
		},
	},
	{
		id: "pc-setup",
		file: "pc-setup.webp",
		grid_span: "col-2",
		sort_order: 5,
		alt: {
			en: "Row of high-spec gaming PCs",
			hu: "Csúcskategoriás játékgépek sorban",
			de: "Reihe hochwertiger Gaming-PCs",
		},
	},
	{
		id: "ps5",
		file: "ps5.webp",
		grid_span: "default",
		sort_order: 6,
		alt: {
			en: "Console lounge with big screen",
			hu: "Konzolsarok nagy tévével",
			de: "Konsolen-Lounge mit großem TV",
		},
	},
	{
		id: "foosball",
		file: "foosball.webp",
		grid_span: "default",
		sort_order: 7,
		alt: {
			en: "Foosball table under amber light",
			hu: "Csocsóasztal borostyán fényben",
			de: "Tischkicker im Bernsteinlicht",
		},
	},
	{
		id: "party",
		file: "party.webp",
		grid_span: "col-2",
		sort_order: 8,
		alt: {
			en: "Birthday sparkler at a private table",
			hu: "Szülinapi szikragyújtás egy privát asztalnál",
			de: "Geburtstagswunderkerze am privaten Tisch",
		},
	},
	{
		id: "boardgames",
		file: "boardgames.webp",
		grid_span: "default",
		sort_order: 9,
		alt: {
			en: "Board game night with beers",
			hu: "Társasjáték-est sörökkel",
			de: "Brettspielabend mit Bier",
		},
	},
	{
		id: "darts",
		file: "darts.webp",
		grid_span: "default",
		sort_order: 10,
		alt: {
			en: "Dartboard corner",
			hu: "Darts sarok",
			de: "Dart-Ecke",
		},
	},
	{
		id: "tournament",
		file: "tournament.webp",
		grid_span: "col-2",
		sort_order: 11,
		alt: {
			en: "Esports final on the big screen",
			hu: "Esport-döntő a nagyvásznon",
			de: "Esport-Finale auf der großen Leinwand",
		},
	},
	{
		id: "cocktail-two",
		file: "cocktail-two.webp",
		grid_span: "col-2",
		sort_order: 12,
		alt: {
			en: "House sour cocktail in coupe glass",
			hu: "Házi sour koktél pohárban",
			de: "Haus-Sour im Coupé-Glas",
		},
	},
];

const MENU_CATEGORY_LABELS: Record<
	(typeof DEFAULT_MENU_CATEGORIES)[number],
	Record<Locale, string>
> = {
	alcoholic: { en: "Alcoholic", hu: "Alkoholos", de: "Alkoholisch" },
	nonalcoholic: { en: "Non-alcoholic", hu: "Alkoholmentes", de: "Alkoholfrei" },
	snacks: { en: "Snacks", hu: "Snackek", de: "Snacks" },
};

const EXPERIENCE_CATEGORY_LABELS: Record<
	(typeof DEFAULT_EXPERIENCE_CATEGORIES)[number],
	Record<Locale, string>
> = {
	gaming: { en: "Gaming", hu: "Gaming", de: "Gaming" },
	social: { en: "Social", hu: "Közösségi", de: "Social" },
	events: { en: "Events", hu: "Események", de: "Events" },
};

const NAV_LABELS: Record<
	Locale,
	{ home: string; menu: string; experiences: string; contact: string }
> = {
	en: {
		home: "Home",
		menu: "Menu",
		experiences: "Experiences",
		contact: "Contact",
	},
	hu: {
		home: "Főoldal",
		menu: "Itallap",
		experiences: "Élmények",
		contact: "Kapcsolat",
	},
	de: {
		home: "Start",
		menu: "Speisekarte",
		experiences: "Erlebnisse",
		contact: "Kontakt",
	},
};

const HOME_COPY: Record<
	Locale,
	{
		title: string;
		hero: {
			kicker: string;
			titleTop: string;
			titleAccent: string;
			subtitle: string;
			ctaMenu: string;
			ctaBook: string;
			scrollHint: string;
		};
		benefits: {
			eyebrow: string;
			title: string;
			items: Array<{ icon: string; title: string; body: string }>;
		};
		menu: {
			eyebrow: string;
			title: string;
			subtitle: string;
			footnote: string;
		};
		gallery: { eyebrow: string; title: string; subtitle: string };
		contact: {
			eyebrow: string;
			title: string;
			subtitle: string;
		};
	}
> = {
	en: {
		title: "Home",
		hero: {
			kicker: "Győr · Szabadsajtó utca 2",
			titleTop: "Esports, craft beer & cocktails",
			titleAccent: "in the heart of Győr",
			subtitle:
				"High-spec gaming rigs, Hungarian Vaskakas craft beer on tap and cocktails shaken by award-winning bartenders — one room, seven days a week.",
			ctaMenu: "View menu",
			ctaBook: "Book a table",
			scrollHint: "Scroll",
		},
		benefits: {
			eyebrow: "Why Bar of Legends",
			title: "Three reasons to pull up a chair",
			items: [
				{
					icon: "beer",
					title: "Vaskakas on tap, legends at the bar",
					body: "Hungarian craft beer from Győr's own Vaskakas brewery, plus cocktails mixed by Hungary's Bartender of the Year. We take the drinks as seriously as the games.",
				},
				{
					icon: "gamepad",
					title: "Gear that never lags",
					body: "High-spec gaming PCs, PS5 stations, a shelf of board games and a weekly pub quiz. Roll in solo or bring the whole squad — there's a seat for every playstyle.",
				},
				{
					icon: "users",
					title: "A local haunt, not a tourist trap",
					body: "Students, regulars and travelling gamers have made this their second living room. Sit down alone and you won't stay alone for long.",
				},
			],
		},
		menu: {
			eyebrow: "The menu",
			title: "The next-gen menu",
			subtitle: "Real prices, real pours — no PDF hunting. Pick your lane.",
			footnote:
				"Prices in HUF. Ask at the bar for today's taps and seasonal specials.",
		},
		gallery: {
			eyebrow: "Gallery",
			title: "Nights at the bar",
			subtitle: "Atmosphere check before you head over.",
		},
		contact: {
			eyebrow: "Contact",
			title: "Find us & plan your night",
			subtitle:
				"Two minutes from Győr city centre — everything you need in one place.",
		},
	},
	hu: {
		title: "Főoldal",
		hero: {
			kicker: "Győr · Szabadsajtó utca 2",
			titleTop: "Esport, kézműves sör és koktélok",
			titleAccent: "Győr szívében",
			subtitle:
				"Csúcskategoriás játékgépek, hazai Vaskakas kézműves sör csapon és az év bartendere mixtúrájában készülő koktélok — egy helyen, a hét hét napján.",
			ctaMenu: "Itallap megtekintése",
			ctaBook: "Asztalfoglalás",
			scrollHint: "Görgess",
		},
		benefits: {
			eyebrow: "Miért a Bar of Legends",
			title: "Három ok, amiért érdemes betérni",
			items: [
				{
					icon: "beer",
					title: "Vaskakas a csapon, legendák a pultnál",
					body: "Hazai kézműves sörök a győri Vaskakas főzdéből, melléjük az év bartendere mixtúrájában koktélok. Az italokat ugyanolyan komolyan vesszük, mint a játékokat.",
				},
				{
					icon: "gamepad",
					title: "Gép, ami sosem akad el",
					body: "Csúcskategoriás játékgépek, PS5-ös állomások, társasjáték-polc és heti pubkvíz. Jöjj egyedül vagy a teljes csapattal — minden játékstílushoz van hely.",
				},
				{
					icon: "users",
					title: "Helyi törzshely, nem turistacsapda",
					body: "Hallgatók, törzsvendégek és vándorló gamerek tették második nappalijukká. Aki egyedül ül be, nem marad sokáig egyedül.",
				},
			],
		},
		menu: {
			eyebrow: "Itallap",
			title: "Következő generációs itallap",
			subtitle: "Valós árak, valódi csapok — PDF-keresés nélkül. Válassz kategóriát.",
			footnote:
				"Az árak forintban értendők. A napi csapokat és a szezonális különlegességeket a pultnál érdemes megkérdezni.",
		},
		gallery: {
			eyebrow: "Galéria",
			title: "Esték a bárban",
			subtitle: "Hangulatellenőrzés, mielőtt elindulsz.",
		},
		contact: {
			eyebrow: "Kapcsolat",
			title: "Találj minket & tervezd meg az estédet",
			subtitle: "Két percre a győri belvárostól — minden info egy helyen.",
		},
	},
	de: {
		title: "Startseite",
		hero: {
			kicker: "Győr · Szabadsajtó utca 2",
			titleTop: "Esport, Craftbier & Cocktails",
			titleAccent: "im Herzen von Győr",
			subtitle:
				"High-End-Gaming-PCs, ungarisches Vaskakas-Craftbier vom Fass und Cocktails vom Barkeeper des Jahres — alles unter einem Dach, sieben Tage die Woche.",
			ctaMenu: "Karte ansehen",
			ctaBook: "Tisch reservieren",
			scrollHint: "Scrollen",
		},
		benefits: {
			eyebrow: "Warum die Bar of Legends",
			title: "Drei Gründe zum Vorbeikommen",
			items: [
				{
					icon: "beer",
					title: "Vaskakas vom Fass, Legenden am Tresen",
					body: "Ungarisches Craftbier aus der Győrer Brauerei Vaskakas, dazu Cocktails vom Barkeeper des Jahres. Wir nehmen Getränke genauso ernst wie Games.",
				},
				{
					icon: "gamepad",
					title: "Hardware, die nie ruckelt",
					body: "High-End-Gaming-PCs, PS5-Stationen, ein Brettspielregal und ein wöchentliches Pub Quiz. Komm allein oder mit dem ganzen Squad — für jeden Spielstil gibt es einen Platz.",
				},
				{
					icon: "users",
					title: "Stammlokal, keine Touristenfalle",
					body: "Studierende, Stammgäste und reisende Gamer haben hier ihr zweites Wohnzimmer. Wer allein kommt, sitzt nicht lange allein.",
				},
			],
		},
		menu: {
			eyebrow: "Die Karte",
			title: "Die Next-Gen-Karte",
			subtitle: "Echte Preise, echte Fässer — keine PDF-Suche. Wähl deine Kategorie.",
			footnote: "Alle Preise in HUF. Tagesfässer und Saisonales gibt es an der Bar.",
		},
		gallery: {
			eyebrow: "Galerie",
			title: "Abende an der Bar",
			subtitle: "Stimmungscheck, bevor du kommst.",
		},
		contact: {
			eyebrow: "Kontakt",
			title: "Finde uns & plan deinen Abend",
			subtitle: "Zwei Minuten von der Győrer Innenstadt — hier ist alles Wichtige.",
		},
	},
};

function homePageContent(locale: Locale) {
	const copy = HOME_COPY[locale];
	return [
		{
			_type: "bol.hero",
			_key: `home-hero-${locale}`,
			...copy.hero,
		},
		{
			_type: "bol.benefits",
			_key: `home-benefits-${locale}`,
			eyebrow: copy.benefits.eyebrow,
			title: copy.benefits.title,
			items: copy.benefits.items,
		},
		{
			_type: "bol.menu",
			_key: `home-menu-${locale}`,
			...copy.menu,
		},
		{
			_type: "bol.gallery",
			_key: `home-gallery-${locale}`,
			...copy.gallery,
		},
		{
			_type: "bol.contact",
			_key: `home-contact-${locale}`,
			...copy.contact,
			showHours: true,
			showMap: true,
			showPhone: true,
			showSocials: true,
		},
	];
}

function media(file: string, alt: string) {
	return {
		$media: { file, alt },
	};
}

/** English term + hu/de translations under one taxonomy def (single admin sidebar entry). */
function localizedTerms(
	prefix: string,
	slugs: string[],
	labels: Record<string, Record<Locale, string>>,
) {
	const terms: Array<Record<string, string>> = [];
	for (const slug of slugs) {
		const id = `${prefix}-${slug}`;
		terms.push({
			id,
			slug,
			label: labels[slug].en,
		});
		for (const locale of ["hu", "de"] as const) {
			terms.push({
				slug,
				label: labels[slug][locale],
				locale,
				translationOf: id,
			});
		}
	}
	return terms;
}

function localizedEntries<T extends { id: string }>(
	items: T[],
	buildData: (item: T, locale: Locale) => Record<string, unknown>,
	buildTaxonomies?: (item: T) => Record<string, string[]>,
) {
	const entries: Record<string, unknown>[] = [];
	for (const item of items) {
		entries.push({
			id: item.id,
			slug: item.id,
			locale: "en",
			status: "published",
			...(buildTaxonomies ? { taxonomies: buildTaxonomies(item) } : {}),
			data: buildData(item, "en"),
		});
		for (const locale of ["hu", "de"] as const) {
			entries.push({
				id: `${item.id}-${locale}`,
				slug: item.id,
				locale,
				translationOf: item.id,
				status: "published",
				...(buildTaxonomies ? { taxonomies: buildTaxonomies(item) } : {}),
				data: buildData(item, locale),
			});
		}
	}
	return entries;
}

function menuUrl(locale: Locale, hash?: string) {
	const base = locale === "en" ? "/" : `/${locale}/`;
	return hash ? `${base}#${hash}` : base;
}

function experiencesUrl(locale: Locale) {
	return locale === "en" ? "/experiences" : `/${locale}/experiences`;
}

const seed = {
	$schema: "https://emdashcms.com/seed.schema.json",
	version: "1",
	meta: {
		name: "Bar of Legends",
		description: "Esports bar in Győr — menu, experiences, gallery, block-built home",
		author: "Bar of Legends",
	},
	settings: {
		title: "Bar of Legends",
		tagline: "Esports bar & craft beer house in the heart of Győr.",
		url: "http://localhost:4321",
		postsPerPage: 10,
		dateFormat: "MMMM d, yyyy",
		timezone: "Europe/Budapest",
		social: {
			instagram: "baroflegendsgyor",
			facebook: "baroflegendsgyor",
			tiktok: "baroflegendsgyor",
		},
		seo: {
			titleSeparator: " · ",
			robotsTxt: null,
			googleVerification: "",
			bingVerification: "",
		},
	},
	collections: [
		{
			slug: "pages",
			label: "Pages",
			labelSingular: "Page",
			urlPattern: "/{slug}",
			supports: ["search", "seo"],
			fields: [
				{
					slug: "title",
					label: "Title",
					type: "string",
					required: true,
					searchable: true,
				},
				{
					slug: "content",
					label: "Content",
					type: "portableText",
					searchable: true,
				},
			],
		},
		{
			slug: "menu_items",
			label: "Menu Items",
			labelSingular: "Menu Item",
			supports: ["search"],
			fields: [
				{
					slug: "name",
					label: "Name",
					type: "string",
					required: true,
					searchable: true,
				},
				{
					slug: "description",
					label: "Description",
					type: "text",
					searchable: true,
				},
				{
					slug: "price",
					label: "Price (HUF)",
					type: "integer",
					required: true,
					translatable: false,
				},
				{
					slug: "image",
					label: "Image",
					type: "image",
					translatable: false,
				},
				{
					slug: "sort_order",
					label: "Sort Order",
					type: "integer",
					translatable: false,
				},
			],
		},
		{
			slug: "experiences",
			label: "Experiences",
			labelSingular: "Experience",
			urlPattern: "/experiences/{slug}",
			supports: ["search", "seo"],
			fields: [
				{
					slug: "title",
					label: "Title",
					type: "string",
					required: true,
					searchable: true,
				},
				{
					slug: "description",
					label: "Description",
					type: "text",
					searchable: true,
				},
				{
					slug: "meta",
					label: "Meta line",
					type: "string",
				},
				{
					slug: "image",
					label: "Image",
					type: "image",
					translatable: false,
				},
				{
					slug: "cta_type",
					label: "CTA Type",
					type: "select",
					translatable: false,
					validation: {
						options: ["tel", "mailto", "ask"],
					},
				},
				{
					slug: "sort_order",
					label: "Sort Order",
					type: "integer",
					translatable: false,
				},
			],
		},
		{
			slug: "gallery_items",
			label: "Gallery Items",
			labelSingular: "Gallery Item",
			supports: ["search"],
			fields: [
				{
					slug: "image",
					label: "Image",
					type: "image",
					required: true,
					translatable: false,
				},
				{
					slug: "alt",
					label: "Alt text",
					type: "string",
					required: true,
				},
				{
					slug: "grid_span",
					label: "Grid span",
					type: "select",
					translatable: false,
					validation: {
						options: ["default", "col-2", "row-2", "col-2-row-2"],
					},
				},
				{
					slug: "sort_order",
					label: "Sort Order",
					type: "integer",
					translatable: false,
				},
			],
		},
	],
	taxonomies: [
		{
			id: "menu_category",
			name: "menu_category",
			label: "Menu Categories",
			labelSingular: "Menu Category",
			hierarchical: false,
			collections: ["menu_items"],
			terms: localizedTerms("menu-cat", [...DEFAULT_MENU_CATEGORIES], MENU_CATEGORY_LABELS),
		},
		{
			id: "experience_category",
			name: "experience_category",
			label: "Experience Categories",
			labelSingular: "Experience Category",
			hierarchical: false,
			collections: ["experiences"],
			terms: localizedTerms("exp-cat", [...DEFAULT_EXPERIENCE_CATEGORIES], EXPERIENCE_CATEGORY_LABELS),
		},
	],
	menus: (["en", "hu", "de"] as const).map((locale) => ({
		id: locale === "en" ? "primary" : `primary-${locale}`,
		name: "primary",
		label: "Primary Navigation",
		locale,
		...(locale !== "en" ? { translationOf: "primary" } : {}),
		items: [
			{
				type: "custom",
				label: NAV_LABELS[locale].home,
				url: menuUrl(locale),
			},
			{
				type: "custom",
				label: NAV_LABELS[locale].menu,
				url: menuUrl(locale, "menu"),
			},
			{
				type: "custom",
				label: NAV_LABELS[locale].experiences,
				url: experiencesUrl(locale),
			},
			{
				type: "custom",
				label: NAV_LABELS[locale].contact,
				url: menuUrl(locale, "contact"),
			},
		],
	})),
	content: {
		menu_items: localizedEntries(
			MENU_ITEMS,
			(item, locale) => ({
				name: item.name[locale],
				description: item.description[locale],
				price: item.price,
				sort_order: item.sort_order,
				image: media(
					MENU_IMAGE[item.id] ?? "beer-pour.webp",
					item.name.en,
				),
			}),
			(item) => ({ menu_category: [item.category] }),
		),
		experiences: localizedEntries(
			EXPERIENCES,
			(item, locale) => ({
				title: item.title[locale],
				description: item.description[locale],
				meta: item.meta[locale],
				cta_type: item.cta_type,
				sort_order: item.sort_order,
				image: media(item.image, item.title.en),
			}),
			(item) => ({ experience_category: [item.category] }),
		),
		gallery_items: localizedEntries(GALLERY, (item, locale) => ({
			alt: item.alt[locale],
			grid_span: item.grid_span,
			sort_order: item.sort_order,
			image: media(item.file, item.alt.en),
		})),
		pages: [
			{
				id: "home",
				slug: "home",
				locale: "en",
				status: "published",
				data: {
					title: HOME_COPY.en.title,
					content: homePageContent("en"),
				},
			},
			{
				id: "home-hu",
				slug: "home",
				locale: "hu",
				translationOf: "home",
				status: "published",
				data: {
					title: HOME_COPY.hu.title,
					content: homePageContent("hu"),
				},
			},
			{
				id: "home-de",
				slug: "home",
				locale: "de",
				translationOf: "home",
				status: "published",
				data: {
					title: HOME_COPY.de.title,
					content: homePageContent("de"),
				},
			},
		],
	},
};

//@ts-expect-error
const outPath = join(import.meta.dir, "..", "seed", "seed.json");
writeFileSync(outPath, `${JSON.stringify(seed, null, "\t")}\n`);
console.log(`Wrote ${outPath}`);

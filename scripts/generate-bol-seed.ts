/**
 * Generates seed/seed.json BOL content from prototype data.
 * Run: bun scripts/generate-bol-seed.ts
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";

type Locale = "en" | "hu" | "de";

const MENU_IMAGE: Record<string, string> = {
	"vaskakas-ipa": "beer-pour.png",
	"vaskakas-lager": "beer-two.png",
	"bartenders-choice": "cocktail.png",
	"legend-sour": "cocktail-two.png",
	"aperol-spritz": "spritz.png",
	"wine-by-the-glass": "wine.png",
	"house-lemonade": "lemonade.png",
	"cold-brew": "coffee.png",
	"vaskakas-zero": "beer-two.png",
	"ginger-fizz": "cocktail-two.png",
	"energy-drinks": "softdrinks.png",
	"sodas-juices": "cola.png",
	"loaded-fries": "fries.png",
	"buffalo-wings": "wings.png",
	"bar-nachos": "platter.png",
	"onion-rings": "fries.png",
	"pretzel-dip": "pretzel.png",
	"squad-platter": "platter.png",
};

const MENU_ITEMS: Array<{
	id: string;
	category: "alcoholic" | "nonalcoholic" | "snacks";
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
	category: "gaming" | "social" | "events";
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
		image: "pc-setup.png",
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
		image: "boardgames.png",
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
		image: "quiz.png",
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
		image: "foosball.png",
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
		image: "party.png",
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
		image: "tournament.png",
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
		file: "crowd.png",
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
		file: "beer-pour.png",
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
		file: "cocktail.png",
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
		file: "quiz.png",
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
		file: "pc-setup.png",
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
		file: "ps5.png",
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
		file: "foosball.png",
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
		file: "party.png",
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
		file: "boardgames.png",
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
		file: "darts.png",
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
		file: "tournament.png",
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
		file: "cocktail-two.png",
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
	"alcoholic" | "nonalcoholic" | "snacks",
	Record<Locale, string>
> = {
	alcoholic: { en: "Alcoholic", hu: "Alkoholos", de: "Alkoholisch" },
	nonalcoholic: { en: "Non-alcoholic", hu: "Alkoholmentes", de: "Alkoholfrei" },
	snacks: { en: "Snacks", hu: "Snackek", de: "Snacks" },
};

const EXPERIENCE_CATEGORY_LABELS: Record<
	"gaming" | "social" | "events",
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
			supports: ["drafts", "revisions", "search", "seo"],
			fields: [
				{
					slug: "title",
					label: "Title",
					type: "string",
					required: true,
					searchable: true,
				},
				{
					slug: "template",
					label: "Page Template",
					type: "select",
					defaultValue: "Full Width",
					validation: {
						options: ["Default", "Full Width", "Sidebar"],
					},
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
			supports: ["drafts", "revisions", "search"],
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
			supports: ["drafts", "revisions", "search", "seo"],
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
			supports: ["drafts", "revisions", "search"],
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
			terms: localizedTerms("menu-cat", ["alcoholic", "nonalcoholic", "snacks"], MENU_CATEGORY_LABELS),
		},
		{
			id: "experience_category",
			name: "experience_category",
			label: "Experience Categories",
			labelSingular: "Experience Category",
			hierarchical: false,
			collections: ["experiences"],
			terms: localizedTerms("exp-cat", ["gaming", "social", "events"], EXPERIENCE_CATEGORY_LABELS),
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
					MENU_IMAGE[item.id] ?? "beer-pour.png",
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
					title: "Home",
					template: "Full Width",
					content: [
						{
							_type: "block",
							_key: "home-stub",
							style: "normal",
							markDefs: [],
							children: [
								{
									_type: "span",
									_key: "home-stub-span",
									text: "Home page blocks land in Part 4 — bol.hero, bol.benefits, bol.menu, bol.gallery, bol.contact.",
									marks: [],
								},
							],
						},
					],
				},
			},
			{
				id: "home-hu",
				slug: "home",
				locale: "hu",
				translationOf: "home",
				status: "published",
				data: {
					title: "Főoldal",
					template: "Full Width",
					content: [
						{
							_type: "block",
							_key: "home-stub-hu",
							style: "normal",
							markDefs: [],
							children: [
								{
									_type: "span",
									_key: "home-stub-hu-span",
									text: "A főoldal blokkjai a 4. részben érkeznek — bol.hero, bol.benefits, bol.menu, bol.gallery, bol.contact.",
									marks: [],
								},
							],
						},
					],
				},
			},
			{
				id: "home-de",
				slug: "home",
				locale: "de",
				translationOf: "home",
				status: "published",
				data: {
					title: "Startseite",
					template: "Full Width",
					content: [
						{
							_type: "block",
							_key: "home-stub-de",
							style: "normal",
							markDefs: [],
							children: [
								{
									_type: "span",
									_key: "home-stub-de-span",
									text: "Startseiten-Blöcke kommen in Teil 4 — bol.hero, bol.benefits, bol.menu, bol.gallery, bol.contact.",
									marks: [],
								},
							],
						},
					],
				},
			},
		],
	},
};

//@ts-expect-error
const outPath = join(import.meta.dir, "..", "seed", "seed.json");
writeFileSync(outPath, `${JSON.stringify(seed, null, "\t")}\n`);
console.log(`Wrote ${outPath}`);

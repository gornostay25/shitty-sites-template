import type { UiStrings } from "./en.ts";

const hu: UiStrings = {
	a11y: {
		skipToContent: "Ugrás a tartalomra",
	},
	nav: {
		label: "Fő navigáció",
		home: "Főoldal",
		menu: "Itallap",
		experiences: "Élmények",
		contact: "Kapcsolat",
		language: "Nyelv",
		openMenu: "Menü megnyitása",
		closeMenu: "Menü bezárása",
	},
	actions: {
		label: "Gyorsműveletek",
		call: "Hívás",
		map: "Térkép",
		menu: "Itallap",
		book: "Foglalás",
	},
	contact: {
		hoursTitle: "Nyitvatartás",
		statusOpenTpl: "Most nyitva · {time}-ig",
		statusClosedTpl: "Most zárva · nyitás: {when}",
		days: [
			"Hétfő",
			"Kedd",
			"Szerda",
			"Csütörtök",
			"Péntek",
			"Szombat",
			"Vasárnap",
		],
		daysShort: ["Hé", "Ke", "Sze", "Cs", "Pé", "Szo", "V"],
		addressTitle: "Cím",
		maps: "Google Maps",
		reachTitle: "Így érsz el minket",
		socialTitle: "Kövess minket",
		socials: {
			instagram: "Bar of Legends az Instagramon",
			facebook: "Bar of Legends a Facebookon",
			tiktok: "Bar of Legends a TikTokon",
		},
	},
	experiences: {
		eyebrow: "Élmények",
		title: "Több mint italok — válaszd ki az éjszakád",
		subtitle:
			"Gaming, kvíz, társasjáték és privát bulik: íme, mi van a menün a sörön túl.",
		filters: {
			all: "Összes",
		},
		filterLabel: "Élmények szűrése",
		book: "Foglalás",
		ask: "Kérdezd a pultnál",
		band: {
			title: "Nem találod, amit keresel?",
			body: "Mondd el, milyen estet képzeltek el, és megrendezzük — szülinapok, céges estek, nézőestek, első randik.",
			button: "Írj nekünk",
		},
	},
	footer: {
		tagline: "Esportbár és kézműves sörház Győr szívében.",
		contactTitle: "Kapcsolat",
		followUs: "Közösség",
		rightsTpl: "© {year} Bar of Legends Győr. Minden jog fenntartva.",
	},
};

export default hu;

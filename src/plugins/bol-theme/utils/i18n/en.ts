const en = {
	a11y: {
		skipToContent: "Skip to content",
	},
	nav: {
		label: "Main navigation",
		home: "Home",
		menu: "Menu",
		experiences: "Experiences",
		contact: "Contact",
		language: "Language",
		openMenu: "Open menu",
		closeMenu: "Close menu",
	},
	actions: {
		label: "Quick actions",
		call: "Call",
		map: "Map",
		menu: "Menu",
		book: "Book",
	},
	contact: {
		hoursTitle: "Opening hours",
		statusOpenTpl: "Open now · until {time}",
		statusClosedTpl: "Closed now · opens {when}",
		days: [
			"Monday",
			"Tuesday",
			"Wednesday",
			"Thursday",
			"Friday",
			"Saturday",
			"Sunday",
		],
		daysShort: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
		addressTitle: "Address",
		maps: "Google Maps",
		reachTitle: "Reach us directly",
		socialTitle: "Follow the legends",
		socials: {
			instagram: "Bar of Legends on Instagram",
			facebook: "Bar of Legends on Facebook",
			tiktok: "Bar of Legends on TikTok",
		},
	},
	footer: {
		tagline: "Esports bar & craft beer house in the heart of Győr.",
		contactTitle: "Contact",
		followUs: "Follow us",
		rightsTpl: "© {year} Bar of Legends Győr. All rights reserved.",
	},
} as const;

export type UiStrings = {
	a11y: {
		skipToContent: string;
	};
	nav: {
		label: string;
		home: string;
		menu: string;
		experiences: string;
		contact: string;
		language: string;
		openMenu: string;
		closeMenu: string;
	};
	actions: {
		label: string;
		call: string;
		map: string;
		menu: string;
		book: string;
	};
	contact: {
		hoursTitle: string;
		statusOpenTpl: string;
		statusClosedTpl: string;
		days: readonly string[];
		daysShort: readonly string[];
		addressTitle: string;
		maps: string;
		reachTitle: string;
		socialTitle: string;
		socials: {
			instagram: string;
			facebook: string;
			tiktok: string;
		};
	};
	footer: {
		tagline: string;
		contactTitle: string;
		followUs: string;
		rightsTpl: string;
	};
};

export default en;

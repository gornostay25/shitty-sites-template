import type { ImageValue } from "emdash";

export type BolHeroNode = {
	_type?: "bol.hero";
	_key?: string;
	kicker?: string;
	titleTop?: string;
	titleAccent?: string;
	subtitle?: string;
	ctaMenu?: string;
	ctaBook?: string;
	scrollHint?: string;
	backgroundImage?: ImageValue | string;
};

export type BolBenefitItem = {
	icon?: "beer" | "gamepad" | "users";
	title?: string;
	body?: string;
};

export type BolBenefitsNode = {
	_type?: "bol.benefits";
	_key?: string;
	eyebrow?: string;
	title?: string;
	items?: BolBenefitItem[];
};

export type BolMenuNode = {
	_type?: "bol.menu";
	_key?: string;
	eyebrow?: string;
	title?: string;
	subtitle?: string;
	footnote?: string;
};

export type BolGalleryNode = {
	_type?: "bol.gallery";
	_key?: string;
	eyebrow?: string;
	title?: string;
	subtitle?: string;
};

export type BolContactNode = {
	_type?: "bol.contact";
	_key?: string;
	eyebrow?: string;
	title?: string;
	subtitle?: string;
	showHours?: boolean;
	showMap?: boolean;
	showPhone?: boolean;
	showSocials?: boolean;
};

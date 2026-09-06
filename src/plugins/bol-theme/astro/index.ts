import Benefits from "./blocks/Benefits.astro";
import Contact from "./blocks/Contact.astro";
import Gallery from "./blocks/Gallery.astro";
import Hero from "./blocks/Hero.astro";
import Menu from "./blocks/Menu.astro";

export const blockComponents = {
	"bol.hero": Hero,
	"bol.benefits": Benefits,
	"bol.menu": Menu,
	"bol.gallery": Gallery,
	"bol.contact": Contact,
};

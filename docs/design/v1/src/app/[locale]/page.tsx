import { notFound } from "next/navigation";
import Hero from "@/components/Hero";
import Benefits from "@/components/Benefits";
import MenuTabs from "@/components/MenuTabs";
import GalleryBento from "@/components/GalleryBento";
import ContactSection from "@/components/ContactSection";
import { getDictionary } from "@/data/i18n";
import { isValidLocale } from "@/data/i18n/config";
import { getMenuByCategory } from "@/data/menu";

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const t = getDictionary(locale);
  const menu = getMenuByCategory(locale);

  return (
    <>
      {/* Block 1 — Hero */}
      <Hero hero={t.hero} />

      {/* Block 2 — Benefits */}
      <Benefits benefits={t.benefits} />

      {/* Block 3 — Next-gen menu */}
      <section
        id="menu"
        aria-labelledby="menu-title"
        className="scroll-mt-20 border-y border-border bg-surface/30"
      >
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 md:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand">
            {t.menu.eyebrow}
          </p>
          <h2 id="menu-title" className="mt-3 font-display text-4xl tracking-wide sm:text-5xl">
            {t.menu.title}
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t.menu.subtitle}
          </p>
          <div className="mt-8">
            <MenuTabs locale={locale} labels={t.menu} items={menu} />
          </div>
        </div>
      </section>

      {/* Block 4 — Gallery (bento) */}
      <GalleryBento locale={locale} gallery={t.gallery} />

      {/* Block 5 — Contact & pragmatics */}
      <ContactSection locale={locale} />
    </>
  );
}

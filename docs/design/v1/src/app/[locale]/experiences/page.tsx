import type { Metadata } from "next";
import Image from "next/image";
import { Mail } from "lucide-react";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import ExperienceGrid from "@/components/ExperienceGrid";
import { getDictionary } from "@/data/i18n";
import { isValidLocale } from "@/data/i18n/config";
import { getExperiences } from "@/data/experiences";
import { VENUE } from "@/data/venue";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const t = getDictionary(locale);
  return {
    title: `${t.experiences.title} | Bar of Legends`,
    description: t.experiences.subtitle,
  };
}

export default async function ExperiencesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const t = getDictionary(locale);
  const items = getExperiences(locale);

  return (
    <>
      {/* Page hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0" aria-hidden="true">
          <Image
            src="/placeholders/tournament.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-bg/80 via-bg/60 to-bg" />
        </div>
        <div className="relative mx-auto w-full max-w-6xl px-4 pb-12 pt-16 sm:px-6 md:pb-16 md:pt-24">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand">
            {t.experiences.eyebrow}
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-5xl leading-[1.03] sm:text-6xl">
            <span className="text-foreground">{t.experiences.title}</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-foreground/80 sm:text-base">
            {t.experiences.subtitle}
          </p>
        </div>
      </section>

      {/* Catalog */}
      <section
        aria-label={t.experiences.title}
        className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 md:py-16"
      >
        <ExperienceGrid
          items={items}
          filters={t.experiences.filters}
          filterLabel={t.experiences.filterLabel}
          locale={locale}
        />
      </section>

      {/* Bottom CTA band */}
      <section aria-labelledby="cta-band-title" className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 md:pb-24">
        <div className="rounded-card border border-brand/30 bg-gradient-to-br from-brand/15 via-surface to-surface p-6 md:p-10">
          <h2 id="cta-band-title" className="font-display text-3xl tracking-wide sm:text-4xl">
            {t.experiences.band.title}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t.experiences.band.body}
          </p>
          <Button asChild size="lg" className="mt-6 min-h-12 px-7 text-base font-semibold">
            <a href={VENUE.mailtoEvent}>
              <Mail className="size-4" aria-hidden="true" />
              {t.experiences.band.button}
            </a>
          </Button>
        </div>
      </section>
    </>
  );
}

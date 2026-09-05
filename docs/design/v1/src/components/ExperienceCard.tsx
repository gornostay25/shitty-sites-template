import Image from "next/image";
import { Clock, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getDictionary } from "@/data/i18n";
import type { Locale } from "@/data/i18n/config";
import type { ExperienceCategory, LocalizedExperience } from "@/data/experiences";
import { VENUE } from "@/data/venue";

const CHIP_STYLES: Record<ExperienceCategory, string> = {
  gaming: "border-brand-muted/40 bg-brand-muted/15 text-brand-muted",
  social: "border-brand/40 bg-brand/15 text-brand",
  events: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
};

export default function ExperienceCard({
  experience,
  locale,
}: {
  experience: LocalizedExperience;
  locale: Locale;
}) {
  const t = getDictionary(locale).experiences;

  const ctaHref =
    experience.cta === "tel"
      ? `tel:${VENUE.phone}`
      : experience.cta === "mailto"
        ? VENUE.mailtoEvent
        : `/${locale}#contact`;
  const ctaLabel = experience.cta === "ask" ? t.ask : t.book;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-card border border-border bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-glow">
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={experience.image}
          alt={experience.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span
          className={cn(
            "absolute left-3 top-3 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider backdrop-blur",
            CHIP_STYLES[experience.category],
          )}
        >
          {t.filters[experience.category]}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-2xl tracking-wide">{experience.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{experience.desc}</p>
        <p className="mb-4 mt-3 flex items-center gap-2 text-xs font-semibold text-brand-muted">
          <Clock className="size-3.5" aria-hidden="true" />
          {experience.meta}
        </p>
        <div className="mt-auto border-t border-white/5 pt-4">
          <Button asChild className="min-h-12 w-full font-semibold sm:w-auto">
            <a href={ctaHref}>
              {experience.cta === "tel" ? (
                <Phone className="size-4" aria-hidden="true" />
              ) : (
                <Mail className="size-4" aria-hidden="true" />
              )}
              {ctaLabel}
            </a>
          </Button>
        </div>
      </div>
    </article>
  );
}

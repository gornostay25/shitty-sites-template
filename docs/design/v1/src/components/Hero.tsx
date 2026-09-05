import Image from "next/image";
import { ArrowDown, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/data/i18n";
import { VENUE } from "@/data/venue";

export default function Hero({ hero }: { hero: Dictionary["hero"] }) {
  return (
    <section className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden bg-bg">
      {/* Cinematic backdrop — poster + slow zoom (video fallback for a later pass) */}
      <div className="absolute inset-0" aria-hidden="true">
        <Image
          src="/placeholders/hero.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover motion-safe:animate-kenburns"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-bg/70 via-bg/30 to-bg" />
        <div className="absolute inset-0 bg-gradient-to-r from-bg/60 via-transparent to-bg/20" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-4 pb-24 pt-32 sm:px-6 md:pb-36">
        <p className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand backdrop-blur">
          <MapPin className="size-3.5" aria-hidden="true" />
          {hero.kicker}
        </p>
        <h1 className="mt-5 max-w-3xl font-display text-5xl leading-[1.03] sm:text-6xl md:text-7xl lg:text-8xl">
          <span className="text-foreground">{hero.titleTop}</span>{" "}
          <span className="text-brand">{hero.titleAccent}</span>
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-foreground/80 sm:text-lg">
          {hero.subtitle}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button asChild size="lg" className="h-12 px-7 text-base font-semibold shadow-glow">
            <a href="#menu">
              {hero.ctaMenu}
              <ArrowDown className="size-4" aria-hidden="true" />
            </a>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-12 border-brand/40 bg-brand/10 px-7 text-base font-semibold text-brand hover:bg-brand/20 hover:text-brand"
          >
            <a href={`tel:${VENUE.phone}`}>{hero.ctaBook}</a>
          </Button>
        </div>
      </div>

      <div
        className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 text-muted-foreground md:flex"
        aria-hidden="true"
      >
        <span className="text-[11px] font-medium uppercase tracking-widest">{hero.scroll}</span>
        <ArrowDown className="size-4 motion-safe:animate-bounce" />
      </div>
    </section>
  );
}

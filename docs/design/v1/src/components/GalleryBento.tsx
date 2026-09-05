import Image from "next/image";
import { cn } from "@/lib/utils";
import { GALLERY } from "@/data/gallery";
import type { Locale } from "@/data/i18n/config";
import type { Dictionary } from "@/data/i18n";

export default function GalleryBento({
  locale,
  gallery,
}: {
  locale: Locale;
  gallery: Dictionary["gallery"];
}) {
  return (
    <section aria-labelledby="gallery-title" className="border-y border-border bg-surface/30">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 md:py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand">
          {gallery.eyebrow}
        </p>
        <h2 id="gallery-title" className="mt-3 font-display text-4xl tracking-wide sm:text-5xl">
          {gallery.title}
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {gallery.subtitle}
        </p>

        <div className="mt-10 grid auto-rows-[150px] grid-cols-2 gap-3 sm:auto-rows-[170px] md:grid-flow-dense md:grid-cols-4 md:gap-4">
          {GALLERY.map((item) => (
            <figure
              key={item.src}
              className={cn(
                "group relative overflow-hidden rounded-card border border-border",
                item.className,
              )}
            >
              <Image
                src={item.src}
                alt={item.alt[locale]}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition duration-500 group-hover:scale-105 group-hover:brightness-110"
              />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

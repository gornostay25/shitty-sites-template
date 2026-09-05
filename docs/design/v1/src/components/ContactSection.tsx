import { Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/data/i18n";
import type { Locale } from "@/data/i18n/config";
import { WEEK_HOURS, formatMinutes } from "@/data/hours";
import { SOCIALS, VENUE } from "@/data/venue";
import OpenNowBadge from "./OpenNowBadge";
import { SocialIcon } from "./icons";
import VenueMap from "./VenueMap";

export default function ContactSection({ locale }: { locale: Locale }) {
  const t = getDictionary(locale).contact;

  return (
    <section id="contact" aria-labelledby="contact-title" className="scroll-mt-20">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 md:py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand">{t.eyebrow}</p>
        <h2 id="contact-title" className="mt-3 font-display text-4xl tracking-wide sm:text-5xl">
          {t.title}
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {t.subtitle}
        </p>

        <div className="mt-10 grid gap-4 md:gap-6 lg:grid-cols-2">
          {/* Opening hours */}
          <div className="rounded-card border border-border bg-surface p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-display text-2xl tracking-wide">{t.hoursTitle}</h3>
              <OpenNowBadge locale={locale} />
            </div>
            <table className="mt-5 w-full text-sm">
              <caption className="sr-only">{t.hoursTitle}</caption>
              <tbody>
                {WEEK_HOURS.map((day, i) => (
                  <tr key={i} className="border-b border-white/5 last:border-0">
                    <th scope="row" className="py-2.5 text-left font-medium text-foreground">
                      {t.days[i]}
                    </th>
                    <td className="py-2.5 text-right tabular-nums text-muted-foreground">
                      {formatMinutes(day.open, locale)} – {formatMinutes(day.close, locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-4 md:gap-6">
            {/* Address + interactive map */}
            <div className="rounded-card border border-border bg-surface p-6">
              <h3 className="font-display text-2xl tracking-wide">{t.addressTitle}</h3>
              <p className="mt-3 flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
                <MapPin className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
                {t.address}
              </p>
              <div className="mt-5 overflow-hidden rounded-xl border border-border">
                <VenueMap lat={VENUE.lat} lng={VENUE.lng} title={VENUE.name} address={t.address} />
              </div>
              <Button asChild className="mt-4 min-h-12 w-full font-semibold">
                <a href={VENUE.mapsUrl} target="_blank" rel="noopener noreferrer">
                  <MapPin className="size-4" aria-hidden="true" />
                  {t.maps}
                </a>
              </Button>
            </div>

            {/* Direct contact + socials */}
            <div className="flex-1 rounded-card border border-border bg-surface p-6">
              <h3 className="font-display text-2xl tracking-wide">{t.reachTitle}</h3>
              <div className="mt-3 flex flex-col gap-1">
                <a
                  href={`tel:${VENUE.phone}`}
                  className="flex min-h-12 items-center gap-3 rounded-lg px-2 text-sm font-medium transition-colors hover:bg-accent"
                >
                  <Phone className="size-4 shrink-0 text-brand" aria-hidden="true" />
                  {VENUE.phoneDisplay}
                </a>
                <a
                  href={`mailto:${VENUE.email}`}
                  className="flex min-h-12 items-center gap-3 break-all rounded-lg px-2 text-sm font-medium transition-colors hover:bg-accent"
                >
                  <Mail className="size-4 shrink-0 text-brand" aria-hidden="true" />
                  {VENUE.email}
                </a>
              </div>
              <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {t.socialTitle}
              </p>
              <div className="mt-3 flex gap-2">
                {SOCIALS.map((social) => (
                  <a
                    key={social.id}
                    href={social.href}
                    aria-label={t.socials[social.id]}
                    className="grid size-12 place-items-center rounded-lg border border-border bg-surface text-muted-foreground transition-colors hover:border-brand/40 hover:text-brand"
                  >
                    <SocialIcon id={social.id} className="size-5" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

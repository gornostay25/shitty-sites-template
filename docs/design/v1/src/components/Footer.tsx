import { Mail, MapPin, Phone } from "lucide-react";
import { getDictionary } from "@/data/i18n";
import type { Locale } from "@/data/i18n/config";
import { WEEK_HOURS, formatMinutes } from "@/data/hours";
import { SOCIALS, VENUE } from "@/data/venue";
import { applyTemplate } from "@/data/format";
import { SocialIcon } from "./icons";

export default function Footer({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface/40">
      <div className="mx-auto w-full max-w-6xl px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-12 sm:px-6 md:pb-10">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <p className="font-display text-2xl tracking-wider">
              <span className="text-foreground">BAR OF </span>
              <span className="text-brand">LEGENDS</span>
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {t.footer.tagline}
            </p>
            <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {t.footer.followUs}
            </p>
            <div className="mt-3 flex gap-2">
              {SOCIALS.map((social) => (
                <a
                  key={social.id}
                  href={social.href}
                  aria-label={t.contact.socials[social.id]}
                  className="grid size-12 place-items-center rounded-lg border border-border bg-surface text-muted-foreground transition-colors hover:border-brand/40 hover:text-brand"
                >
                  <SocialIcon id={social.id} className="size-5" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-display text-xl tracking-wide">{t.footer.hoursTitle}</h2>
            <dl className="mt-4 space-y-1.5">
              {WEEK_HOURS.map((day, i) => (
                <div key={i} className="flex items-baseline justify-between gap-4 text-sm">
                  <dt className="text-muted-foreground">{t.contact.days[i]}</dt>
                  <dd className="tabular-nums text-foreground">
                    {formatMinutes(day.open, locale)} – {formatMinutes(day.close, locale)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div>
            <h2 className="font-display text-xl tracking-wide">{t.footer.contactTitle}</h2>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-start gap-3 text-muted-foreground">
                <MapPin className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
                <span>{t.contact.address}</span>
              </li>
              <li>
                <a
                  href={`mailto:${VENUE.email}`}
                  className="flex min-h-11 items-center gap-3 break-all text-muted-foreground transition-colors hover:text-brand"
                >
                  <Mail className="size-4 shrink-0 text-brand" aria-hidden="true" />
                  {VENUE.email}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${VENUE.phone}`}
                  className="flex min-h-11 items-center gap-3 text-muted-foreground transition-colors hover:text-brand"
                >
                  <Phone className="size-4 shrink-0 text-brand" aria-hidden="true" />
                  {VENUE.phoneDisplay}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/5 pt-6 text-center text-xs text-muted-foreground">
          {applyTemplate(t.footer.rights, { year: String(year) })}
        </div>
      </div>
    </footer>
  );
}

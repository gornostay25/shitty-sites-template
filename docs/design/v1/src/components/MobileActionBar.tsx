import { Beer, CalendarCheck, MapPin, Phone } from "lucide-react";
import { getDictionary } from "@/data/i18n";
import type { Locale } from "@/data/i18n/config";
import { VENUE } from "@/data/venue";

export default function MobileActionBar({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);

  const actions = [
    { id: "call", href: `tel:${VENUE.phone}`, label: t.actions.call, icon: Phone, external: false },
    { id: "menu", href: `/${locale}#menu`, label: t.actions.menu, icon: Beer, external: false },
    { id: "map", href: VENUE.mapsUrl, label: t.actions.map, icon: MapPin, external: true },
    { id: "book", href: VENUE.mailtoBooking, label: t.actions.book, icon: CalendarCheck, external: false },
  ];

  return (
    <nav
      aria-label={t.actions.label}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md md:hidden"
    >
      <div className="mx-auto grid w-full max-w-md grid-cols-4">
        {actions.map((action) => (
          <a
            key={action.id}
            href={action.href}
            {...(action.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-brand"
          >
            <action.icon className="size-5 text-brand" aria-hidden="true" />
            {action.label}
          </a>
        ))}
      </div>
      <div className="h-[env(safe-area-inset-bottom)] bg-background" aria-hidden="true" />
    </nav>
  );
}

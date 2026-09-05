"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getDictionary } from "@/data/i18n";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/data/i18n/config";

export default function LanguageSwitcher({
  locale,
  className,
}: {
  locale: Locale;
  className?: string;
}) {
  const t = getDictionary(locale);
  const pathname = usePathname() ?? `/${locale}`;
  const rest = pathname.replace(/^\/(en|hu|de)/, "") || "";

  return (
    <nav
      aria-label={t.nav.language}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border bg-surface/80 p-1 backdrop-blur",
        className,
      )}
    >
      {LOCALES.map((l) => {
        const active = l === locale;
        return (
          <Link
            key={l}
            href={`/${l}${rest}`}
            hrefLang={l}
            aria-current={active ? "true" : undefined}
            className={cn(
              "inline-flex h-12 items-center justify-center rounded-full px-2 text-xs font-semibold uppercase tracking-widest transition-colors md:h-9 md:min-w-10",
              active
                ? "bg-brand text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {LOCALE_LABELS[l]}
          </Link>
        );
      })}
    </nav>
  );
}

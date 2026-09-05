"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ChevronRight, Gamepad2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDictionary } from "@/data/i18n";
import type { Locale } from "@/data/i18n/config";
import { SOCIALS, VENUE } from "@/data/venue";
import LanguageSwitcher from "./LanguageSwitcher";
import { SocialIcon } from "./icons";

type NavItem = { href: string; label: string; active: boolean };

export default function MobileNav({
  locale,
  items,
  onClose,
}: {
  locale: Locale;
  items: NavItem[];
  onClose: () => void;
}) {
  const t = getDictionary(locale);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.nav.label}
      className="fixed inset-0 z-50 md:hidden"
    >
      <div className="absolute inset-0 bg-background/95 backdrop-blur-md" />
      <div className="scrollbar-slim relative flex h-full flex-col overflow-y-auto px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3">
        <div className="flex h-16 shrink-0 items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-lg border border-brand/30 bg-brand/10 text-brand">
              <Gamepad2 className="size-5" aria-hidden="true" />
            </span>
            <span className="font-display text-xl tracking-wider">
              <span className="text-foreground">BAR OF </span>
              <span className="text-brand">LEGENDS</span>
            </span>
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.nav.closeMenu}
            className="grid size-12 place-items-center rounded-md text-foreground transition-colors hover:bg-accent"
          >
            <X className="size-6" aria-hidden="true" />
          </button>
        </div>

        <nav aria-label={t.nav.label} className="mt-6 flex flex-col gap-3">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              aria-current={item.active ? "page" : undefined}
              className={cn(
                "flex min-h-14 items-center justify-between rounded-xl border border-border bg-surface px-4 transition-colors hover:border-brand/40",
                item.active ? "text-brand" : "text-foreground",
              )}
            >
              <span className="font-display text-3xl tracking-wide">{item.label}</span>
              <ChevronRight className="size-5 text-brand" aria-hidden="true" />
            </Link>
          ))}
        </nav>

        <div className="mt-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {t.nav.language}
          </p>
          <LanguageSwitcher locale={locale} className="flex w-full" />
        </div>

        <div className="mt-auto pt-10">
          <address className="text-sm not-italic leading-relaxed text-muted-foreground">
            {t.contact.address}
          </address>
          <div className="mt-4 flex gap-3">
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
          <p className="mt-6 text-xs text-muted-foreground">{VENUE.phoneDisplay}</p>
        </div>
      </div>
    </div>
  );
}

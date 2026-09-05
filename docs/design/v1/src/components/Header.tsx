"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Gamepad2, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDictionary } from "@/data/i18n";
import type { Locale } from "@/data/i18n/config";
import LanguageSwitcher from "./LanguageSwitcher";
import MobileNav from "./MobileNav";

export default function Header({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const pathname = usePathname() ?? `/${locale}`;
  const [open, setOpen] = useState(false);

  const navItems = [
    {
      href: `/${locale}`,
      label: t.nav.home,
      active: pathname === `/${locale}`,
    },
    {
      href: `/${locale}#menu`,
      label: t.nav.menu,
      active: false,
    },
    {
      href: `/${locale}/experiences`,
      label: t.nav.experiences,
      active: pathname.startsWith(`/${locale}/experiences`),
    },
    {
      href: `/${locale}#contact`,
      label: t.nav.contact,
      active: false,
    },
  ];

  return (
    <>
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
        <Link
          href={`/${locale}`}
          className="flex min-h-12 items-center gap-2 rounded-md"
          aria-label={`Bar of Legends — ${t.nav.home}`}
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-brand/30 bg-brand/10 text-brand">
            <Gamepad2 className="size-5" aria-hidden="true" />
          </span>
          <span className="whitespace-nowrap font-display text-lg leading-none tracking-wider sm:text-2xl">
            <span className="text-foreground">BAR OF </span>
            <span className="text-brand">LEGENDS</span>
          </span>
        </Link>

        <nav aria-label={t.nav.label} className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                item.active
                  ? "text-brand"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <LanguageSwitcher locale={locale} />
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-haspopup="dialog"
            aria-label={t.nav.openMenu}
            className="grid size-12 place-items-center rounded-md text-foreground transition-colors hover:bg-accent md:hidden"
          >
            <Menu className="size-6" aria-hidden="true" />
          </button>
        </div>
      </div>
      </header>

      {/* Rendered outside <header>: the header's backdrop-blur creates a containing
          block that would trap the fixed full-screen overlay inside the 64px bar. */}
      {open && <MobileNav locale={locale} items={navItems} onClose={() => setOpen(false)} />}
    </>
  );
}

"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { formatHUF } from "@/data/format";
import type { Locale } from "@/data/i18n/config";
import type { Dictionary } from "@/data/i18n";
import type { LocalizedMenuItem, MenuCategory } from "@/data/menu";

type Props = {
  locale: Locale;
  labels: Dictionary["menu"];
  items: Record<MenuCategory, LocalizedMenuItem[]>;
};

const TAB_ORDER: MenuCategory[] = ["alcoholic", "nonalcoholic", "snacks"];

export default function MenuTabs({ locale, labels, items }: Props) {
  const [active, setActive] = useState<MenuCategory>("alcoholic");

  return (
    <div>
      <div
        role="tablist"
        aria-label={labels.title}
        className="flex w-full gap-1 rounded-full border border-border bg-surface p-1 sm:inline-flex sm:w-auto"
      >
        {TAB_ORDER.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            id={`menu-tab-${tab}`}
            aria-selected={active === tab}
            aria-controls={`menu-panel-${tab}`}
            onClick={() => setActive(tab)}
            className={cn(
              "min-h-12 flex-1 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-colors sm:flex-none sm:px-6",
              active === tab
                ? "bg-brand text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {labels.tabs[tab]}
          </button>
        ))}
      </div>

      {TAB_ORDER.map((tab) => (
        <div
          key={tab}
          role="tabpanel"
          id={`menu-panel-${tab}`}
          aria-labelledby={`menu-tab-${tab}`}
          hidden={active !== tab}
          className="mt-8"
        >
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items[tab].map((item) => (
              <li
                key={item.id}
                className="group overflow-hidden rounded-card border border-border bg-surface transition-all duration-300 hover:border-brand/40 hover:shadow-glow"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute right-3 top-3 rounded-full bg-background/90 px-3 py-1.5 font-display text-lg tracking-wide text-brand backdrop-blur">
                    {formatHUF(item.price, locale)}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-display text-2xl tracking-wide">{item.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <p className="mt-6 text-xs text-muted-foreground">{labels.note}</p>
    </div>
  );
}

"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import ExperienceCard from "./ExperienceCard";
import type { Dictionary } from "@/data/i18n";
import type { Locale } from "@/data/i18n/config";
import type { ExperienceCategory, LocalizedExperience } from "@/data/experiences";

type Filter = "all" | ExperienceCategory;

const FILTERS: Filter[] = ["all", "gaming", "social", "events"];

export default function ExperienceGrid({
  items,
  filters,
  filterLabel,
  locale,
}: {
  items: LocalizedExperience[];
  filters: Dictionary["experiences"]["filters"];
  filterLabel: string;
  locale: Locale;
}) {
  const [active, setActive] = useState<Filter>("all");
  const visible = active === "all" ? items : items.filter((item) => item.category === active);

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label={filterLabel}>
        {FILTERS.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setActive(filter)}
            aria-pressed={active === filter}
            className={cn(
              "min-h-12 rounded-full border px-5 text-sm font-semibold transition-colors",
              active === filter
                ? "border-brand bg-brand text-primary-foreground"
                : "border-border bg-surface text-muted-foreground hover:border-brand/40 hover:text-foreground",
            )}
          >
            {filters[filter]}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((item) => (
          <ExperienceCard key={item.id} experience={item} locale={locale} />
        ))}
      </div>
    </div>
  );
}

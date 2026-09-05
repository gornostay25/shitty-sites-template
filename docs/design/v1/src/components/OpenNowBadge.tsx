"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { computeStatus } from "@/data/hours";
import { applyTemplate } from "@/data/format";
import { getDictionary } from "@/data/i18n";
import type { Locale } from "@/data/i18n/config";

export default function OpenNowBadge({ locale }: { locale: Locale }) {
  const t = getDictionary(locale).contact;
  const [status, setStatus] = useState<ReturnType<typeof computeStatus> | null>(null);

  useEffect(() => {
    const update = () => setStatus(computeStatus(new Date(), locale));
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, [locale]);

  return (
    <span
      aria-live="polite"
      className={cn(
        "inline-flex min-h-9 items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold",
        status === null && "border-border bg-surface",
        status?.isOpen && "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
        status && !status.isOpen && "border-border bg-surface text-muted-foreground",
      )}
    >
      {status === null ? (
        <span className="size-2 rounded-full bg-muted-foreground" aria-hidden="true" />
      ) : status.isOpen ? (
        <>
          <span
            className="size-2 rounded-full bg-emerald-400 motion-safe:animate-status-pulse"
            aria-hidden="true"
          />
          {applyTemplate(t.statusOpenTpl, { time: status.time })}
        </>
      ) : (
        <>
          <span className="size-2 rounded-full bg-muted-foreground" aria-hidden="true" />
          {applyTemplate(t.statusClosedTpl, {
            when:
              status.opensOnDay !== null &&
              status.opensOnDay !== (((new Date().getDay() + 6) % 7) as number)
                ? `${t.daysShort[status.opensOnDay]} ${status.time}`
                : status.time,
          })}
        </>
      )}
    </span>
  );
}

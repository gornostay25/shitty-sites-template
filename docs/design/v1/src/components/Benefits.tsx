import { Beer, Gamepad2, Users } from "lucide-react";
import type { Dictionary } from "@/data/i18n";

const ICONS = {
  beer: Beer,
  gamepad: Gamepad2,
  users: Users,
} as const;

export default function Benefits({ benefits }: { benefits: Dictionary["benefits"] }) {
  return (
    <section
      aria-labelledby="benefits-title"
      className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 md:py-24"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand">
        {benefits.eyebrow}
      </p>
      <h2 id="benefits-title" className="mt-3 font-display text-4xl tracking-wide sm:text-5xl">
        {benefits.title}
      </h2>

      <div className="mt-10 grid gap-4 md:grid-cols-3 md:gap-6">
        {benefits.items.map((item) => {
          const Icon = ICONS[item.icon];
          return (
            <article
              key={item.title}
              className="group rounded-card border border-border bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-glow"
            >
              <span className="grid size-12 place-items-center rounded-xl border border-brand/20 bg-brand/10 text-brand">
                <Icon className="size-6" aria-hidden="true" />
              </span>
              <h3 className="mt-5 font-display text-2xl tracking-wide">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

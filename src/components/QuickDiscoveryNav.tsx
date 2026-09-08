"use client";

import { QUICK_DISCOVERY, type QuickDiscoveryItem } from "@/lib/quickDiscovery";
import { cn } from "@/lib/cn";

/** The stable id every category `<details>` in the full guide reference renders with, so this nav (and nothing else) has one shared naming convention to target. */
export function categoryAnchorId(key: string): string {
  return `guide-cat-${key}`;
}

function activate(item: QuickDiscoveryItem) {
  if (item.target.type === "section") {
    document.getElementById(item.target.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  const ids = item.target.keys.map(categoryAnchorId);
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el instanceof HTMLDetailsElement) el.open = true;
  }
  document.getElementById(ids[0])?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * The town guide's front door and its sticky category nav in one: large,
 * one-tap buttons under the hero that jump straight to (and open) the
 * relevant part of the guide further down, rather than making a guest
 * scroll past everything to find the one thing they came for. `sticky`
 * with a `top` matching the site header's own height, so once a guest
 * scrolls past the hero this becomes a persistent way back to any other
 * category without scrolling all the way up.
 */
export function QuickDiscoveryNav({ className }: { className?: string }) {
  return (
    <nav
      aria-label="Quick discovery"
      className={cn("sticky top-16 z-20 -mx-6 bg-surface/95 px-6 py-3 backdrop-blur-sm", className)}
    >
      <div className="relative h-[4.5rem] w-full">
        <div className="absolute inset-0 flex snap-x snap-mandatory items-center gap-2.5 overflow-x-auto overscroll-x-contain scroll-smooth [mask-image:linear-gradient(to_right,black_calc(100%-24px),transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {QUICK_DISCOVERY.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => activate(item)}
              className="focus-ring flex shrink-0 snap-start flex-col items-center gap-1.5 rounded-2xl border border-border-subtle bg-surface px-4 py-2.5 text-xs font-semibold text-zinc-700 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:text-brand-800 hover:shadow-[var(--shadow-card-hover)]"
            >
              <item.icon className="h-5 w-5 text-brand-600" aria-hidden />
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

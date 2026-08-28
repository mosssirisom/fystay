"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type TabKey = "upcoming" | "past" | "cancelled";

/**
 * Tab switching is the only interactive part of "My trips" — the sections
 * themselves are rendered server-side (so BookingCard's data fetching and
 * server-only queries stay on the server) and simply passed in as children.
 */
export function BookingsTabs({
  counts,
  upcoming,
  past,
  cancelled,
}: {
  counts: Record<TabKey, number>;
  upcoming: ReactNode;
  past: ReactNode;
  cancelled: ReactNode;
}) {
  const initialTab: TabKey =
    counts.upcoming > 0 ? "upcoming" : counts.past > 0 ? "past" : counts.cancelled > 0 ? "cancelled" : "upcoming";
  const [tab, setTab] = useState<TabKey>(initialTab);

  const tabs: { key: TabKey; label: string; content: ReactNode }[] = [
    { key: "upcoming", label: "Upcoming", content: upcoming },
    { key: "past", label: "Past trips", content: past },
    { key: "cancelled", label: "Cancelled", content: cancelled },
  ];

  return (
    <div className="mt-6">
      <div role="tablist" className="flex gap-1 border-b border-border-subtle">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "focus-ring -mb-px flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
              tab === t.key
                ? "border-brand-700 text-brand-700"
                : "border-transparent text-zinc-500 hover:text-foreground",
            )}
          >
            {t.label}
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-xs font-semibold",
                tab === t.key ? "bg-brand-50 text-brand-800" : "bg-surface-muted text-zinc-500",
              )}
            >
              {counts[t.key]}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-6" role="tabpanel">
        {tabs.find((t) => t.key === tab)?.content}
      </div>
    </div>
  );
}

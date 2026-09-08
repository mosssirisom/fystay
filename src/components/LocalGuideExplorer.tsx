"use client";

import { useState } from "react";
import { ChevronDown, X } from "lucide-react";
import type { GuideCategoryKey, GuideEntry, TownGuide } from "@/lib/localGuide";
import { MOOD_CATEGORY_PRIORITY, MOODS, orderCategoriesForMood, topPicksForMood, type MoodKey } from "@/lib/moods";
import { entryMatchesCategory, locateEntry, prioritizeEntriesByDistance, type OriginListing } from "@/lib/guideLocation";
import { categoryAnchorId } from "@/components/QuickDiscoveryNav";
import { EntryLocationMeta } from "@/components/EntryLocationMeta";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

/**
 * The interactive half of the Local Guide: a one-tap "what are you looking
 * for" chip row that re-sorts (never hides) the same 14 categories every
 * town guide already has, plus a small "top picks" strip pulled straight
 * from that reordering so picking a mood pays off immediately, before the
 * guest expands a single card. Deliberately its own client component
 * rather than making the whole LocalGuide client-side: the static heading,
 * intro and insider tip above have no interactivity and stay server-
 * rendered, and this component's own default state (no mood picked) is the
 * exact order the server already rendered, so hydration never causes a
 * visible reflow.
 *
 * `fromListing`, when present, layers real distance on top of the mood
 * reordering: every category's own entries sort closest-first, and any
 * entry naming a real place gets a distance/walk/drive-time line.
 *
 * `mood`/`onMoodChange` make this controllable from outside: the premium
 * town guide page's own "Personalised Experience" picker drives this
 * component (and its FYStay Picks carousel) from one shared selection
 * rather than each rendering a separate, redundant chip row. Omit both to
 * keep this fully standalone (its own chips, its own state) - the default,
 * used anywhere this hasn't been wired to an external picker.
 */
export function LocalGuideExplorer({
  guide,
  destinationName,
  fromListing,
  mood: controlledMood,
  onMoodChange,
}: {
  guide: TownGuide;
  destinationName: string;
  fromListing: OriginListing | null;
  mood?: MoodKey | null;
  onMoodChange?: (mood: MoodKey | null) => void;
}) {
  const [internalMood, setInternalMood] = useState<MoodKey | null>(null);
  const isControlled = controlledMood !== undefined;
  const mood = isControlled ? controlledMood : internalMood;
  const setMood = onMoodChange ?? setInternalMood;

  function toggleMood(key: MoodKey) {
    setMood(mood === key ? null : key);
  }

  const selectedMood = MOODS.find((m) => m.key === mood);
  const priorityKeys = mood ? new Set(MOOD_CATEGORY_PRIORITY[mood]) : null;
  const orderedCategories = orderCategoriesForMood(mood);
  const topPicks = mood ? topPicksForMood(guide, mood, fromListing) : [];

  return (
    <div className="mt-6">
      {!isControlled && (
        <>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-foreground">What are you looking for?</p>
            {selectedMood && (
              <button
                type="button"
                onClick={() => setMood(null)}
                className="focus-ring flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-medium text-zinc-500 hover:text-zinc-700"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
                Clear
              </button>
            )}
          </div>

          {/* Fixed-height wrapper + absolutely-positioned scroll row, same
              technique as ListingsCarousel: an in-flow row wide enough to need
              horizontal scrolling can make mobile browsers compute the page's
              layout viewport from its full unscrolled width, letting a swipe
              pan into blank space past the real content. Taking it out of flow
              avoids that regardless of how many mood chips end up in this row. */}
          <div className="relative mt-3 h-11 w-full">
            <div className="absolute inset-0 flex snap-x snap-mandatory items-center gap-2 overflow-x-auto overscroll-x-contain scroll-smooth [mask-image:linear-gradient(to_right,black_calc(100%-24px),transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {MOODS.map(({ key, label, icon: Icon }) => {
                const active = mood === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleMood(key)}
                    aria-pressed={active}
                    className={cn(
                      "focus-ring flex shrink-0 snap-start items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
                      active
                        ? "border-brand-600 bg-brand-600 text-white"
                        : "border-border-subtle bg-surface text-zinc-600 hover:bg-surface-muted",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      <p aria-live="polite" className="sr-only">
        {selectedMood
          ? `Showing recommendations for ${selectedMood.label.toLowerCase()} in ${destinationName}`
          : "Showing every local guide category"}
      </p>

      {selectedMood && topPicks.length > 0 && (
        <div className="mt-5 rounded-2xl border border-brand-100 bg-brand-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
            Top picks for {selectedMood.label.toLowerCase()} in {destinationName}
          </p>
          <ul className="mt-3 flex flex-col gap-3 sm:grid sm:grid-cols-3 sm:gap-3">
            {topPicks.map(({ category, categoryLabel, entry }) => (
              <li key={category} className="rounded-xl bg-surface p-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-brand-700">{categoryLabel}</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{entry.name}</p>
                <p className="mt-0.5 text-xs text-zinc-500">{entry.note}</p>
                <EntryLocationMeta location={locateEntry(fromListing, entry.place)} />
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {orderedCategories.map(({ key, label, icon: Icon }) => {
          const entries = guide[key];
          if (entries.length === 0) return null;
          const isPriority = priorityKeys?.has(key) ?? false;
          const orderedEntries = prioritizeEntriesByDistance(entries, fromListing);
          return (
            <details
              key={key}
              id={categoryAnchorId(key)}
              className={cn(
                "group scroll-mt-36 rounded-2xl border bg-surface p-5 open:shadow-[var(--shadow-card)]",
                isPriority ? "border-brand-300" : "border-border-subtle",
              )}
            >
              <summary className="flex cursor-pointer list-none items-center gap-3 marker:content-none">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="font-semibold text-foreground">{label}</span>
                {isPriority && (
                  <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                    Match
                  </span>
                )}
                <ChevronDown
                  className="ml-auto h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200 group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <ul className="mt-4 flex flex-col gap-3 border-t border-border-subtle pt-4">
                {orderedEntries.map((entry) => (
                  <EntryRow key={entry.name} guide={guide} category={key} entry={entry} fromListing={fromListing} />
                ))}
              </ul>
            </details>
          );
        })}
      </div>
    </div>
  );
}

/**
 * One recommendation row: the entry's own text, plus a distance badge when
 * it names a real place and family/dog badges when the guide's own
 * family/dogFriendly categories already list this exact entry elsewhere -
 * a fact the guide already asserts, surfaced here rather than a new claim.
 */
function EntryRow({
  guide,
  category,
  entry,
  fromListing,
}: {
  guide: TownGuide;
  category: GuideCategoryKey;
  entry: GuideEntry;
  fromListing: OriginListing | null;
}) {
  const isFamilyFriendly = category !== "family" && entryMatchesCategory(guide, "family", entry.name);
  const isDogFriendly = category !== "dogFriendly" && entryMatchesCategory(guide, "dogFriendly", entry.name);

  return (
    <li>
      <div className="flex flex-wrap items-center gap-1.5">
        <p className="text-sm font-medium text-foreground">{entry.name}</p>
        {isFamilyFriendly && <Badge variant="brand">Family-friendly</Badge>}
        {isDogFriendly && <Badge variant="brand">Dog-friendly</Badge>}
      </div>
      <p className="mt-0.5 text-sm text-zinc-500">{entry.note}</p>
      <EntryLocationMeta location={locateEntry(fromListing, entry.place)} />
    </li>
  );
}

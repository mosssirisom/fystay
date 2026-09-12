"use client";

import { useState } from "react";
import { BookOpen, Sparkles, X } from "lucide-react";
import { PERSONALIZATION_PREFERENCES, type MoodKey } from "@/lib/moods";
import type { LocalRecommendation } from "@/lib/localData/recommendationEngine";
import type { TownGuide } from "@/lib/localGuide";
import type { OriginListing } from "@/lib/guideLocation";
import { FYStayPicks } from "@/components/FYStayPicks";
import { LocalGuideExplorer } from "@/components/LocalGuideExplorer";
import { SectionHeading } from "@/components/SectionHeading";
import { cn } from "@/lib/cn";

/**
 * One shared preference, driving every personalised part of the page:
 * picking "Beach" here instantly re-sorts FYStay Picks (via the same pure
 * scoreRecommendation function the server used to build the baseline
 * order) and reorders the full category reference below it (the same
 * mechanism LocalGuideExplorer's own standalone mood picker already used -
 * this just controls it from one shared chip row instead of a second,
 * redundant one).
 */
export function PersonalizedGuideSection({
  destinationName,
  recommendations,
  rainy,
  guide,
  fromListing,
}: {
  destinationName: string;
  recommendations: LocalRecommendation[];
  rainy: boolean;
  guide: TownGuide;
  fromListing: OriginListing | null;
}) {
  const [mood, setMood] = useState<MoodKey | null>(null);

  return (
    <>
      <section className="mt-10">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
              <Sparkles className="h-4 w-4" aria-hidden />
            </span>
            <p className="text-lg font-semibold text-foreground">Personalised for you</p>
          </div>
          {mood && (
            <button
              type="button"
              onClick={() => setMood(null)}
              className="focus-ring flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-medium text-stone-500 hover:text-stone-700"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
              Clear
            </button>
          )}
        </div>
        <p className="mt-1.5 max-w-2xl text-sm text-stone-600">
          Tell us what you&apos;re after and we&apos;ll reorder our picks for {destinationName} to match.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {PERSONALIZATION_PREFERENCES.map(({ key, label, icon: Icon }) => {
            const active = mood === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setMood(active ? null : key)}
                aria-pressed={active}
                className={cn(
                  "focus-ring flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
                  active
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "border-border-subtle bg-surface text-stone-600 hover:bg-surface-muted",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {label}
              </button>
            );
          })}
        </div>
      </section>

      <FYStayPicks recommendations={recommendations} mood={mood} rainy={rainy} />

      <section className="mt-10">
        <SectionHeading icon={BookOpen}>The full {destinationName} guide</SectionHeading>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
          Every category, in one place - jump here from any Quick Discovery button above.
        </p>
        <LocalGuideExplorer
          guide={guide}
          destinationName={destinationName}
          fromListing={fromListing}
          mood={mood}
          onMoodChange={setMood}
        />
      </section>
    </>
  );
}

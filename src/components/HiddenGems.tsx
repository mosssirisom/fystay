import { Gem } from "lucide-react";
import type { LocalRecommendation } from "@/lib/localData/recommendationEngine";
import { describeWhyRecommended } from "@/lib/localData/whyRecommended";
import { PLACE_CATEGORY_LABEL } from "@/lib/placeCategoryDisplay";
import { PlaceCategoryArt } from "@/components/PlaceCategoryArt";

/**
 * A dedicated home for FYStay's HIDDEN_GEM-tagged picks - the same ranked
 * recommendation list FYStay Picks draws from, filtered to just this tag,
 * so a lesser-known spot never has to compete for attention against the
 * town's obvious highlights in the main carousel above. Deliberately a
 * quieter, darker grid rather than another bright carousel, so the section
 * itself reads as "the stuff most visitors miss" rather than more of the
 * same.
 */
export function HiddenGems({ destinationName, recommendations }: { destinationName: string; recommendations: LocalRecommendation[] }) {
  const gems = recommendations.filter((rec) => rec.editorialTag === "HIDDEN_GEM").slice(0, 6);
  if (gems.length === 0) return null;

  return (
    <section className="mt-10 rounded-3xl bg-zinc-900 p-6 sm:p-8">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-amber-300">
          <Gem className="h-4 w-4" aria-hidden />
        </span>
        <p className="text-lg font-semibold text-white">Hidden Gems</p>
      </div>
      <p className="mt-1.5 max-w-2xl text-sm text-white/60">
        The stuff most visitors to {destinationName} walk straight past.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {gems.map((gem) => (
          <article key={gem.id} className="overflow-hidden rounded-2xl bg-white/5">
            <PlaceCategoryArt category={gem.category} className="h-28 w-full opacity-90" />
            <div className="p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-300">
                {PLACE_CATEGORY_LABEL[gem.category]}
              </p>
              <p className="mt-1 font-semibold text-white">{gem.name}</p>
              {gem.description && <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-white/60">{gem.description}</p>}
              <p className="mt-2 text-xs italic text-white/50">{describeWhyRecommended(gem)}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

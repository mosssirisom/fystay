/**
 * One-time (safe-to-re-run) migration of the hand-written Local Guide and
 * Local Knowledge content (src/lib/localGuide.ts, src/lib/localKnowledge.ts
 * - written and reviewed in earlier sessions) into EditorialRecommendation
 * rows, so the live data platform launches with real, human-written
 * curation as its FYStay editorial layer and its fallback-of-last-resort,
 * rather than starting empty. Upserts by a stable slug (town + category +
 * name), so re-running after editing the static content just updates the
 * same rows rather than duplicating them.
 *
 * Only categories that are genuinely "picks" get migrated - amenities,
 * transport, parking and events are practical/logistical information, not
 * a featured recommendation, and stay out of this table. Two of the nine
 * EditorialTag values (BEST_CHEAP_EAT, BEST_FOR_COUPLES) are deliberately
 * never auto-assigned here: the existing content doesn't carry real price
 * or couples-specific signal, and guessing either would be a new,
 * unverified claim this migration has no business making. Both tags stay
 * available in the schema for a human to use with real knowledge later.
 */
import { PrismaClient, type EditorialTag, type LocalPlaceCategory } from "@prisma/client";
import { LOCAL_GUIDES, type GuideCategoryKey } from "../src/lib/localGuide";
import { LOCAL_KNOWLEDGE, type LocalKnowledgeCategoryKey } from "../src/lib/localKnowledge";
import { FYLDE_COAST_DESTINATIONS } from "../src/lib/destinations";
import { TOWN_COORDINATES } from "../src/lib/geocoding";

const prisma = new PrismaClient();

const GUIDE_CATEGORY_MAP: Partial<Record<GuideCategoryKey, { tag: EditorialTag; category: LocalPlaceCategory }>> = {
  thingsToDo: { tag: "FYSTAY_PICK", category: "ATTRACTION" },
  eat: { tag: "FYSTAY_PICK", category: "RESTAURANT" },
  coffeeAndBreakfast: { tag: "BEST_BREAKFAST", category: "CAFE" },
  family: { tag: "BEST_FOR_FAMILIES", category: "ATTRACTION" },
  pubsAndNightlife: { tag: "FYSTAY_PICK", category: "PUB" },
  shopping: { tag: "FYSTAY_PICK", category: "SHOP" },
  dogFriendly: { tag: "FYSTAY_PICK", category: "PARK" },
  hiddenGems: { tag: "HIDDEN_GEM", category: "ATTRACTION" },
  rainyDay: { tag: "BEST_RAINY_DAY", category: "ATTRACTION" },
  // beachesAndWalks is handled separately below - it splits into
  // BEST_BEACH or BEST_WALK per entry, not one tag for the whole category.
};

const KNOWLEDGE_CATEGORY_MAP: Partial<Record<LocalKnowledgeCategoryKey, { tag: EditorialTag; category: LocalPlaceCategory }>> = {
  familyBeaches: { tag: "BEST_BEACH", category: "BEACH" },
  sunsetSpots: { tag: "FYSTAY_PICK", category: "VIEWPOINT" },
  hiddenGem: { tag: "HIDDEN_GEM", category: "ATTRACTION" },
};

function slugify(...parts: string[]): string {
  return parts
    .join("-")
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function upsertRecommendation(params: {
  townSlug: string;
  tag: EditorialTag;
  name: string;
  category: LocalPlaceCategory;
  description: string;
  rank: number;
}) {
  const slug = slugify(params.townSlug, params.tag, params.name);
  await prisma.editorialRecommendation.upsert({
    where: { slug },
    create: { slug, ...params },
    update: { tag: params.tag, name: params.name, category: params.category, description: params.description, rank: params.rank },
  });
}

async function main() {
  await Promise.all(
    FYLDE_COAST_DESTINATIONS.map((destination) => {
      const coordinates = TOWN_COORDINATES[destination.searchCity.toLowerCase()];
      if (!coordinates) return Promise.resolve();
      return prisma.localTown.upsert({
        where: { slug: destination.slug },
        create: { slug: destination.slug, name: destination.name, ...coordinates },
        update: { name: destination.name, ...coordinates },
      });
    }),
  );

  let count = 0;

  for (const [townSlug, guide] of Object.entries(LOCAL_GUIDES)) {
    for (const [categoryKey, entries] of Object.entries(guide)) {
      if (categoryKey === "insiderTip") continue;

      if (categoryKey === "beachesAndWalks") {
        for (const [rank, entry] of (entries as { name: string; note: string }[]).entries()) {
          const isBeach = /beach/i.test(entry.name);
          await upsertRecommendation({
            townSlug,
            tag: isBeach ? "BEST_BEACH" : "BEST_WALK",
            name: entry.name,
            category: isBeach ? "BEACH" : "PARK",
            description: entry.note,
            rank,
          });
          count++;
        }
        continue;
      }

      const mapping = GUIDE_CATEGORY_MAP[categoryKey as GuideCategoryKey];
      if (!mapping) continue;

      for (const [rank, entry] of (entries as { name: string; note: string }[]).entries()) {
        await upsertRecommendation({
          townSlug,
          tag: mapping.tag,
          name: entry.name,
          category: mapping.category,
          description: entry.note,
          rank,
        });
        count++;
      }
    }
  }

  for (const [townSlug, knowledge] of Object.entries(LOCAL_KNOWLEDGE)) {
    for (const [categoryKey, entry] of Object.entries(knowledge)) {
      const mapping = KNOWLEDGE_CATEGORY_MAP[categoryKey as LocalKnowledgeCategoryKey];
      if (!mapping) continue;

      const typedEntry = entry as { headline: string; body: string };
      await upsertRecommendation({
        townSlug,
        tag: mapping.tag,
        name: typedEntry.headline,
        category: mapping.category,
        description: typedEntry.body,
        rank: 0,
      });
      count++;
    }
  }

  console.log(`Seeded/updated ${count} editorial recommendation(s) from static Local Guide content.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

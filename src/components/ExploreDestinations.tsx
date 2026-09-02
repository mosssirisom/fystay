import Link from "next/link";
import { Anchor, Compass, FerrisWheel, Flower2, Waves, Wind, type LucideIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/cn";
import { FYLDE_COAST_DESTINATIONS } from "@/lib/destinations";

const DESTINATION_ART: Record<string, { icon: LucideIcon; gradient: string }> = {
  blackpool: { icon: FerrisWheel, gradient: "from-brand-600 via-brand-700 to-brand-900" },
  "lytham-st-annes": { icon: Wind, gradient: "from-brand-500 to-ink" },
  cleveleys: { icon: Waves, gradient: "from-sky-500 to-brand-800" },
  fleetwood: { icon: Anchor, gradient: "from-ink to-brand-950" },
  bispham: { icon: Flower2, gradient: "from-accent-500 to-brand-700" },
};

/**
 * The tile a live per-town count couldn't (or shouldn't yet) speak to a
 * single town: a catch-all pointing at every published listing, standing
 * in for "and surrounding Fylde Coast areas" rather than inventing another
 * named place with no listings behind it.
 */
const MORE_TILE = {
  name: "More of the coast",
  href: "/search",
  icon: Compass,
  gradient: "from-brand-700 via-brand-800 to-ink",
};

export function ExploreDestinationsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="aspect-[4/3] w-full animate-pulse rounded-2xl bg-surface-muted" />
      ))}
    </div>
  );
}

function DestinationTile({
  name,
  href,
  icon: Icon,
  gradient,
  subtitle,
}: {
  name: string;
  href: string;
  icon: LucideIcon;
  gradient: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "focus-ring group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-2xl bg-gradient-to-br p-4 shadow-[var(--shadow-card)] ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]",
        gradient,
      )}
    >
      <Icon
        className="absolute -right-3 -top-3 h-24 w-24 text-white/15 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
        aria-hidden
      />
      <div className="relative">
        <p className="text-base font-bold text-white sm:text-lg">{name}</p>
        <p className="mt-0.5 text-xs text-white/80">{subtitle}</p>
      </div>
    </Link>
  );
}

/**
 * A geographic index of the towns FYStay covers, each tile filtering
 * straight to that town's real search results today - and, since every
 * destination here is keyed by a stable slug, the same list a future
 * dedicated landing page (/destinations/[slug]) for "accommodation in
 * Blackpool"-style searches would read from, without this section having
 * to change shape when that page exists. Fetches its own listing counts
 * (one grouped count query) rather than taking them as a prop, matching
 * how the other independent homepage sections (FeaturedHero,
 * MarketplaceSections) each own their own data below their Suspense
 * boundary in page.tsx.
 */
export async function ExploreDestinations() {
  const counts = await prisma.listing.groupBy({
    by: ["city"],
    where: { published: true },
    _count: { _all: true },
  });
  const countByCity = new Map(counts.map((row) => [row.city, row._count._all]));

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6">
      {FYLDE_COAST_DESTINATIONS.map((destination) => {
        const art = DESTINATION_ART[destination.slug];
        const count = countByCity.get(destination.searchCity) ?? 0;
        return (
          <DestinationTile
            key={destination.slug}
            name={destination.name}
            href={`/search?city=${encodeURIComponent(destination.searchCity)}`}
            icon={art.icon}
            gradient={art.gradient}
            subtitle={count > 0 ? `${count} stay${count === 1 ? "" : "s"} to explore` : "Coming soon"}
          />
        );
      })}
      <DestinationTile
        name={MORE_TILE.name}
        href={MORE_TILE.href}
        icon={MORE_TILE.icon}
        gradient={MORE_TILE.gradient}
        subtitle="Every stay on the coast"
      />
    </div>
  );
}

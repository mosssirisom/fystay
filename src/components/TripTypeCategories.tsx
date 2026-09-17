import Link from "next/link";
import { BedDouble, Gem, Umbrella, UsersRound, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Each tile routes to a real, working /search filter (see
 * lib/listingSearch.ts's parseListingFiltersFromParams for the exact param
 * names) rather than a decorative link - a "Luxury Stay" that led nowhere
 * useful would be worse than not having the tile at all. Framed as
 * trip-type inspiration, not as a promise about the catalog's actual size
 * or star rating in any one category.
 *
 * Seaside Escape (amenities=sea_view) was dropped: too few listings tag a
 * sea view yet for the filter to feel worth a whole tile - the same "only
 * show what's actually worth showing" call this section has always made.
 */
const TRIP_TYPES: { name: string; description: string; icon: LucideIcon; href: string }[] = [
  {
    name: "Family Break",
    description: "Space for everyone",
    icon: UsersRound,
    href: "/search?minBedrooms=2",
  },
  {
    name: "Weekend Away",
    description: "A short break, sorted",
    icon: Umbrella,
    href: "/search",
  },
  {
    name: "Premium Stay",
    description: "Our top-priced picks",
    icon: Gem,
    href: "/search?sort=price_desc",
  },
  {
    name: "Longer Stay",
    description: "Weekly & monthly discounts",
    icon: BedDouble,
    href: "/search?sort=price_asc",
  },
];

export function TripTypeCategories() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6">
      {TRIP_TYPES.map(({ name, description, icon: Icon, href }) => (
        <Link
          key={name}
          href={href}
          className={cn(
            "focus-ring group flex flex-col items-start gap-3 rounded-2xl border border-border-subtle bg-surface p-5 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-1.5 hover:border-brand-200 hover:shadow-[var(--shadow-card-hover)] active:scale-[0.98] active:border-brand-200 sm:p-6",
          )}
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 transition-colors group-hover:bg-brand-100 sm:h-14 sm:w-14">
            <Icon className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground sm:text-base">{name}</p>
            <p className="mt-0.5 text-xs text-stone-500 sm:text-sm">{description}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

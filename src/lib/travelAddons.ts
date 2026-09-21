import { prisma } from "@/lib/prisma";
import type { ExtraCategory } from "@prisma/client";

export type TravelAddonOffering = {
  id: string;
  name: string;
  description: string | null;
  category: ExtraCategory;
  priceCents: number;
  features: string[];
  providerName: string;
};

/**
 * The one query every cross-sell surface (homepage, property page, booking
 * flow, confirmation, account, /travel-extras) calls to find what to show
 * for a given add-on category - see docs/trip-extras-roadmap.md. Generic
 * over ExtraCategory on purpose (see item 7 of the cross-sell brief): EV
 * Exec is the only active AIRPORT_TRANSFER offering today, but a future
 * attraction/car-hire/restaurant surface reuses this exact function rather
 * than each surface writing its own Prisma query.
 *
 * `findFirst` ordered by createdAt is a deliberate MVP choice for "which
 * offering represents this category" while at most one is ever active per
 * category - picking a "featured" one among several is a later problem.
 */
export async function getActiveOfferingByCategory(
  category: ExtraCategory,
): Promise<TravelAddonOffering | null> {
  const offering = await prisma.extraOffering.findFirst({
    where: { category, active: true, provider: { active: true } },
    include: { provider: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });
  if (!offering) return null;
  return {
    id: offering.id,
    name: offering.name,
    description: offering.description,
    category: offering.category,
    priceCents: offering.priceCents,
    features: offering.features,
    providerName: offering.provider.name,
  };
}

/** Plain-language label per category - shared so every surface's copy agrees. */
export const ADDON_CATEGORY_LABELS: Record<ExtraCategory, string> = {
  AIRPORT_TRANSFER: "Airport transfer",
  ATTRACTION_TICKET: "Attraction ticket",
  CAR_HIRE: "Car hire",
};

/** Every cross-sell CTA across the site links here - one generic landing page per category, not a bespoke page per add-on. */
export function travelAddonHref(category: ExtraCategory): string {
  return `/travel-extras?category=${category}`;
}

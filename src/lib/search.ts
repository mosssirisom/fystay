export type GuestCounts = {
  adults: number;
  children: number;
  infants: number;
  pets: number;
};

/** Infants don't count toward a listing's guest capacity, matching common booking-site convention. */
export function totalOccupants({
  adults,
  children,
}: Pick<GuestCounts, "adults" | "children">): number {
  return adults + children;
}

export function isPetFriendly(amenities: string[]): boolean {
  return amenities.some((amenity) => /pet/i.test(amenity));
}

export function summarizeGuests({ adults, children, infants, pets }: GuestCounts): string {
  const guests = adults + children;
  const parts: string[] = [];
  if (guests > 0) parts.push(`${guests} guest${guests === 1 ? "" : "s"}`);
  if (infants > 0) parts.push(`${infants} infant${infants === 1 ? "" : "s"}`);
  if (pets > 0) parts.push(`${pets} pet${pets === 1 ? "" : "s"}`);
  return parts.length > 0 ? parts.join(", ") : "Add guests";
}

/** Parses a guest-count query param, discarding anything that isn't a non-negative integer. */
export function parseGuestParam(value: string | string[] | undefined, fallback: number): number {
  const n = typeof value === "string" ? Number(value) : NaN;
  return Number.isInteger(n) && n >= 0 ? n : fallback;
}

/** Same rule as parseGuestParam, under a name that reads sensibly for bedrooms/bathrooms/rating filters. */
export function parseIntParam(value: string | string[] | undefined, fallback: number): number {
  return parseGuestParam(value, fallback);
}

/**
 * Pure slug helpers for AffiliateHotel.slug (see that model's own schema
 * comment) - the stable, public identifier `/hotels/[destination]/[slug]`
 * looks a cached hotel up by. Kept separate from the uniqueness check
 * itself (which needs a database read - see src/lib/hotelProviders/search.ts)
 * so the actual slug-building logic is directly unit-testable.
 */

export function slugify(input: string): string {
  const slug = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "hotel";
}

export function buildHotelSlugBase(name: string, city: string): string {
  return `${slugify(name)}-${slugify(city)}`;
}

/**
 * Appends a counted suffix ("-2", "-3", ...) only if the base is already
 * taken, so the common case (a hotel's name+city combination is unique)
 * gets the clean, undecorated slug. `isTaken` is a plain predicate rather
 * than this function doing its own database read, so the actual database
 * query (one findMany, batched - see search.ts) stays entirely outside
 * this pure function.
 */
export function ensureUniqueSlug(base: string, isTaken: (candidate: string) => boolean): string {
  if (!isTaken(base)) return base;
  let suffix = 2;
  while (isTaken(`${base}-${suffix}`)) suffix++;
  return `${base}-${suffix}`;
}

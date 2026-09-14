/**
 * Whether a User or Listing has been suspended by an admin (see
 * User.suspendedAt / Listing.suspendedAt in prisma/schema.prisma - both
 * models use the same nullable-timestamp convention). A pure function
 * since this exact question gets asked from several unrelated places -
 * both NextAuth callbacks in src/auth.ts, booking creation in
 * src/app/api/bookings/route.ts, and the listing detail page - and every
 * caller should agree on what "suspended" means without re-deriving it.
 */
export function isSuspended(entity: { suspendedAt: Date | null }): boolean {
  return entity.suspendedAt !== null;
}

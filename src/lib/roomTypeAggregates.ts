import type { Prisma } from "@prisma/client";

/**
 * A HOTEL listing has no price/capacity of its own - each RoomType does.
 * But every other surface (search filtering/sorting, the listing card, the
 * detail page's stat chips and JSON-LD, MobileBookingBar) reads those
 * fields straight off Listing, and none of them are hotel-aware. Rather
 * than teach every one of those call sites about room types, this keeps
 * Listing's own price/capacity columns in sync as a denormalized summary -
 * "from £X/night", "up to N guests" - computed from whatever room types
 * currently exist. Call this inside the same transaction as any write that
 * adds/edits/removes a RoomType, after the write.
 *
 * A listing with zero room types (mid-creation, before any have been added
 * yet) is left untouched - there's nothing to summarize, and the publish
 * guardrail in the listings API stops a HOTEL listing with no room types
 * from ever going live regardless.
 */
export async function recomputeListingAggregatesFromRoomTypes(
  tx: Prisma.TransactionClient,
  listingId: string,
): Promise<void> {
  const roomTypes = await tx.roomType.findMany({
    where: { listingId },
    select: { pricePerNightCents: true, maxGuests: true, bedrooms: true, beds: true, bathrooms: true },
  });

  if (roomTypes.length === 0) return;

  await tx.listing.update({
    where: { id: listingId },
    data: {
      pricePerNightCents: Math.min(...roomTypes.map((r) => r.pricePerNightCents)),
      maxGuests: Math.max(...roomTypes.map((r) => r.maxGuests)),
      bedrooms: Math.max(...roomTypes.map((r) => r.bedrooms)),
      beds: Math.max(...roomTypes.map((r) => r.beds)),
      bathrooms: Math.max(...roomTypes.map((r) => r.bathrooms)),
    },
  });
}

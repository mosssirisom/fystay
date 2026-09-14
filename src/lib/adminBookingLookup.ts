import { prisma } from "@/lib/prisma";

/**
 * The read side of admin booking support tooling (/admin/bookings and the
 * matching /api/admin/bookings* routes - see the routes' own comments for
 * the auth/validation that wraps these). Shared between the API routes
 * (used by the client-side search box, which needs a live fetch as the
 * admin types) and the server-rendered detail page (which can just call
 * this directly, the same way every other admin page in this codebase
 * queries Prisma straight from a server component) so the two never drift
 * into two different ideas of what a booking "is" for support purposes.
 */

/** Below this, a search would either return the whole table or scan it uselessly - neither is worth allowing on a growing table. */
export const MIN_QUERY_LENGTH = 2;
export const SEARCH_RESULT_LIMIT = 25;

export async function searchBookingsForAdmin(q: string) {
  const query = q.trim();
  if (query.length < MIN_QUERY_LENGTH) return null;

  return prisma.booking.findMany({
    where: {
      OR: [
        { reference: { contains: query, mode: "insensitive" } },
        { guestName: { contains: query, mode: "insensitive" } },
        { guestEmail: { contains: query, mode: "insensitive" } },
        { guest: { name: { contains: query, mode: "insensitive" } } },
        { guest: { email: { contains: query, mode: "insensitive" } } },
        { listing: { host: { name: { contains: query, mode: "insensitive" } } } },
        { listing: { host: { email: { contains: query, mode: "insensitive" } } } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: SEARCH_RESULT_LIMIT,
    select: {
      id: true,
      reference: true,
      checkIn: true,
      checkOut: true,
      status: true,
      paymentStatus: true,
      totalPriceCents: true,
      guestName: true,
      guestEmail: true,
      listing: { select: { title: true, host: { select: { name: true, email: true } } } },
      guest: { select: { name: true, email: true } },
    },
  });
}

export type AdminBookingSearchRow = NonNullable<
  Awaited<ReturnType<typeof searchBookingsForAdmin>>
>[number];

export async function getBookingDetailForAdmin(id: string) {
  return prisma.booking.findUnique({
    where: { id },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          city: true,
          country: true,
          address: true,
          cancellationPolicy: true,
          customCancellationCutoffDays: true,
          customCancellationRefundPercent: true,
          host: { select: { id: true, name: true, email: true } },
        },
      },
      guest: { select: { id: true, name: true, email: true, createdAt: true } },
      changeRequests: { orderBy: { createdAt: "desc" } },
      extras: {
        orderBy: { createdAt: "desc" },
        include: { offering: { select: { name: true, category: true } } },
      },
      disputes: { orderBy: { createdAt: "desc" } },
      pmsReservationLink: {
        select: {
          externalReservationId: true,
          pushStatus: true,
          pushedAt: true,
          cancelPushStatus: true,
        },
      },
    },
  });
}

export type AdminBookingDetail = NonNullable<Awaited<ReturnType<typeof getBookingDetailForAdmin>>>;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { expireStaleBookingRequests } from "@/lib/bookingLifecycle";
import { sendBookingRequestRespondedEmail } from "@/lib/notificationEmails";

/** Same trust model as refresh-local-data's isAuthorizedCronRequest - see that file for the full reasoning. */
function isAuthorizedCronRequest(request: Request): boolean {
  if (request.headers.get("x-vercel-cron")) return true;

  const secret = process.env.BOOKING_REQUEST_CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

/**
 * Daily backstop for request-to-book requests (see Listing.instantBook)
 * the host never responded to. expireStaleBookingRequests itself already
 * runs lazily whenever a guest's or host's own bookings are read, so this
 * only matters for a request neither of them happens to check back on -
 * this app has no background job runner to fire the moment
 * requestExpiresAt actually passes, so a guest can wait up to a day past
 * that deadline for this email if they never open their booking in the
 * meantime.
 */
export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const expired = await expireStaleBookingRequests(prisma);

  for (const booking of expired) {
    try {
      await sendBookingRequestRespondedEmail(
        {
          reference: booking.reference,
          listingTitle: booking.listing.title,
          city: booking.listing.city,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          nights: booking.nights,
          guests: booking.guests,
          totalPriceCents: booking.totalPriceCents,
          guestName: booking.guestName,
          guestEmail: booking.guestEmail,
          hostName: booking.listing.host.name,
          hostEmail: booking.listing.host.email,
          bookingUrl: `${baseUrl}/bookings/${booking.id}`,
        },
        "expired",
      );
    } catch (error) {
      console.error(`expiry email failed for booking ${booking.id}:`, error);
    }
  }

  return NextResponse.json({ expiredAt: new Date().toISOString(), count: expired.length });
}

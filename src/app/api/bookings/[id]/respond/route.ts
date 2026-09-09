import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { blockingBookingWhere, blockingRanges, isRangeAvailable } from "@/lib/availability";
import { sendBookingRequestRespondedEmail } from "@/lib/notificationEmails";

const respondSchema = z.object({ action: z.enum(["approve", "decline"]) });

/**
 * A host accepting or declining a request-to-book request (see
 * Listing.instantBook and BookingApprovalStatus) - the equivalent of
 * change-requests/[requestId]/respond, but for the booking itself rather
 * than a change to an existing one, since a request never had a payment to
 * unwind in the first place.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = respondSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { listing: { include: { host: true } } },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (booking.listing.hostId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (booking.approvalStatus !== "AWAITING") {
    return NextResponse.json(
      { error: "This request has already been responded to" },
      { status: 409 },
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const emailCtx = {
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
  };

  if (parsed.data.action === "decline") {
    // Never charged - so nothing to refund except the referral credit (see
    // referral.ts) the guest had spent on this booking at creation. Unlike
    // an instant-book PENDING booking that simply goes unpaid, a decline
    // here is entirely the host's call, not something the guest let lapse.
    await prisma.$transaction([
      prisma.booking.update({
        where: { id },
        data: { status: "CANCELLED", approvalStatus: "DECLINED", hostRespondedAt: new Date() },
      }),
      ...(booking.creditAppliedCents > 0
        ? [
            prisma.user.update({
              where: { id: booking.guestId },
              data: { creditBalanceCents: { increment: booking.creditAppliedCents } },
            }),
          ]
        : []),
    ]);
    await sendBookingRequestRespondedEmail(
      { ...emailCtx, bookingUrl: `${baseUrl}/bookings/${booking.id}` },
      "declined",
    );
    return NextResponse.json({ status: "declined" });
  }

  // Approving: re-check availability, since the dates may have been booked
  // or blocked by something else while this request sat awaiting a
  // decision (up to REQUEST_HOLD_HOURS).
  const [otherBookings, blocks] = await Promise.all([
    prisma.booking.findMany({
      where: {
        listingId: booking.listingId,
        id: { not: booking.id },
        ...blockingBookingWhere(),
      },
      select: { checkIn: true, checkOut: true },
    }),
    prisma.availabilityBlock.findMany({
      where: { listingId: booking.listingId },
      select: { startDate: true, endDate: true },
    }),
  ]);
  if (!isRangeAvailable(booking.checkIn, booking.checkOut, blockingRanges(otherBookings, blocks))) {
    return NextResponse.json(
      { error: "Those dates are no longer available" },
      { status: 409 },
    );
  }

  await prisma.booking.update({
    where: { id },
    data: { approvalStatus: "APPROVED", hostRespondedAt: new Date() },
  });
  await sendBookingRequestRespondedEmail(
    { ...emailCtx, bookingUrl: `${baseUrl}/checkout/${booking.id}` },
    "approved",
  );

  return NextResponse.json({ status: "approved" });
}

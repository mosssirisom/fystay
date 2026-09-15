import { NextResponse } from "next/server";
import { withApiErrorHandling } from "@/lib/apiError";
import { prisma } from "@/lib/prisma";
import {
  ARRIVAL_REMINDER_WINDOW_DAYS,
  REVIEW_REQUEST_DELAY_DAYS,
  needsArrivalReminder,
  needsReviewRequest,
} from "@/lib/bookingLifecycleEmails";
import { sendArrivalReminderEmail, sendReviewRequestEmail } from "@/lib/notificationEmails";

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/** Same trust model as sync-ical-imports' own isAuthorizedCronRequest - see that file for the full reasoning. */
function isAuthorizedCronRequest(request: Request): boolean {
  if (request.headers.get("x-vercel-cron")) return true;

  const secret = process.env.BOOKING_LIFECYCLE_CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

/**
 * Daily sweep for the two proactive guest emails this app doesn't otherwise
 * send: an arrival reminder a couple of days before check-in, and a review
 * request a day after checkout (see src/lib/bookingLifecycleEmails.ts for
 * the exact eligibility rules). One combined route rather than two, same
 * reasoning as security-deposits' own cron - both are cheap daily sweeps
 * over a small set of bookings. Each query below is a coarse DB-level
 * filter, same two-step shape as that cron: needsArrivalReminder/
 * needsReviewRequest make the real, precise, unit-tested call per row. One
 * booking failing to send is logged and skipped, never fatal to the rest
 * of the run.
 */
async function getHandler(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const now = new Date();

  const arrivalCandidates = await prisma.booking.findMany({
    where: {
      status: "CONFIRMED",
      paymentStatus: "PAID",
      arrivalReminderSentAt: null,
      checkIn: { gte: now, lte: addDays(now, ARRIVAL_REMINDER_WINDOW_DAYS) },
    },
    include: { listing: { include: { host: true } } },
  });

  let arrivalRemindersSent = 0;
  for (const booking of arrivalCandidates) {
    if (!needsArrivalReminder(booking, now)) continue;
    try {
      await sendArrivalReminderEmail(
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
        {
          address: booking.listing.address,
          checkInTime: booking.listing.checkInTime,
          checkInInstructions: booking.listing.checkInInstructions,
          wifiNetwork: booking.listing.wifiNetwork,
          wifiPassword: booking.listing.wifiPassword,
        },
      );
      await prisma.booking.update({
        where: { id: booking.id },
        data: { arrivalReminderSentAt: now },
      });
      arrivalRemindersSent += 1;
    } catch (error) {
      console.error(`arrival reminder failed for booking ${booking.id}:`, error);
    }
  }

  const reviewCandidates = await prisma.booking.findMany({
    where: {
      status: { in: ["CONFIRMED", "COMPLETED"] },
      reviewRequestSentAt: null,
      review: null,
      checkOut: { lte: addDays(now, -REVIEW_REQUEST_DELAY_DAYS) },
    },
    include: { listing: { include: { host: true } }, review: { select: { id: true } } },
  });

  let reviewRequestsSent = 0;
  for (const booking of reviewCandidates) {
    if (!needsReviewRequest(booking, now)) continue;
    try {
      await sendReviewRequestEmail(
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
        // The review form itself only lives inline on the "My trips" list
        // (see BookingCard/canReviewBooking), not on the booking detail
        // page - this points straight there rather than a query param the
        // trips page doesn't read.
        `${baseUrl}/bookings`,
      );
      await prisma.booking.update({
        where: { id: booking.id },
        data: { reviewRequestSentAt: now },
      });
      reviewRequestsSent += 1;
    } catch (error) {
      console.error(`review request failed for booking ${booking.id}:`, error);
    }
  }

  return NextResponse.json({ ranAt: now.toISOString(), arrivalRemindersSent, reviewRequestsSent });
}

export const GET = withApiErrorHandling(getHandler);

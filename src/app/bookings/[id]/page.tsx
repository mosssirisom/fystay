import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { blockingBookingWhere } from "@/lib/availability";
import { completePastBookings } from "@/lib/bookingLifecycle";
import { canCancelBooking, canRequestBookingChange } from "@/lib/changeRequests";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { PhotoGallery } from "@/components/PhotoGallery";
import { BookingSummaryCard } from "@/components/BookingSummaryCard";
import { RequestChangeDialog } from "@/components/RequestChangeDialog";
import { CancelBookingButton } from "@/components/CancelBookingButton";
import { ChangeRequestStatus } from "@/components/ChangeRequestStatus";
import type { BadgeProps } from "@/components/ui/Badge";

export const metadata: Metadata = { title: "Booking details", robots: { index: false } };

const actionLinkClass =
  "focus-ring w-fit rounded-lg px-2 py-1 text-sm font-medium text-zinc-700 hover:bg-surface-muted";

const statusVariant: Record<string, BadgeProps["variant"]> = {
  PENDING: "warning",
  CONFIRMED: "success",
  CANCELLED: "neutral",
  COMPLETED: "brand",
  REFUNDED: "neutral",
};

const statusLabel: Record<string, string> = {
  PENDING: "Pending payment",
  CONFIRMED: "Confirmed",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
  REFUNDED: "Refunded",
};

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    redirect(`/login?callbackUrl=/bookings/${id}`);
  }

  await completePastBookings(prisma, session.user.id);

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      listing: {
        include: {
          host: { select: { name: true, email: true, image: true } },
          bookings: {
            where: blockingBookingWhere(),
            select: { id: true, checkIn: true, checkOut: true },
          },
        },
      },
      changeRequests: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!booking || booking.guestId !== session.user.id) {
    notFound();
  }

  const latestChangeRequest = booking.changeRequests[0];
  const hasPendingChangeRequest = latestChangeRequest?.status === "PENDING";
  const showChangeRequestStatus =
    latestChangeRequest &&
    (latestChangeRequest.status === "PENDING" ||
      latestChangeRequest.status === "DECLINED" ||
      (latestChangeRequest.status === "APPROVED" &&
        latestChangeRequest.priceDeltaCents > 0 &&
        !latestChangeRequest.paidAt));

  // A paid (or since-refunded) booking is a real, confirmed reservation, so
  // it's the right moment to reveal the exact address and a direct way to
  // reach the host — neither of which the public listing page shows.
  const canSeeStayDetails = booking.paymentStatus === "PAID" || booking.paymentStatus === "REFUNDED";
  const canModify = canRequestBookingChange(booking, hasPendingChangeRequest);
  const canCancel = canCancelBooking(booking);
  const canRebook =
    booking.status === "COMPLETED" || booking.status === "CANCELLED" || booking.status === "REFUNDED";

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-8 pb-24 lg:pb-8">
      <Link
        href="/bookings"
        className="focus-ring inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-zinc-500 hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to my trips
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{booking.listing.title}</h1>
          <p className="mt-1 text-zinc-600">
            {booking.listing.city}, {booking.listing.country}
          </p>
          <p className="mt-1 text-xs font-medium text-zinc-400">Booking #{booking.reference}</p>
        </div>
        <Badge variant={statusVariant[booking.status]}>
          {statusLabel[booking.status] ?? booking.status}
        </Badge>
      </div>

      <PhotoGallery photos={booking.listing.photos} title={booking.listing.title} />

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Where you&apos;re staying</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1 text-sm text-zinc-600">
              <p>
                {booking.listing.city}, {booking.listing.country}
              </p>
              {canSeeStayDetails && booking.listing.address && <p>{booking.listing.address}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your host</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <Avatar name={booking.listing.host.name} src={booking.listing.host.image} />
              <div>
                <p className="font-medium text-foreground">{booking.listing.host.name}</p>
                {canSeeStayDetails && booking.listing.host.email && (
                  <p className="text-sm text-zinc-500">{booking.listing.host.email}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Manage this booking</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {showChangeRequestStatus && (
                <ChangeRequestStatus
                  bookingId={booking.id}
                  requestId={latestChangeRequest.id}
                  status={latestChangeRequest.status}
                  requestedCheckIn={latestChangeRequest.requestedCheckIn}
                  requestedCheckOut={latestChangeRequest.requestedCheckOut}
                  requestedGuests={latestChangeRequest.requestedGuests}
                  priceDeltaCents={latestChangeRequest.priceDeltaCents}
                  paidAt={latestChangeRequest.paidAt}
                />
              )}

              <div className="flex flex-col items-start gap-1">
                <Link href={`/listings/${booking.listingId}`} className={actionLinkClass}>
                  View property
                </Link>

                {canModify && (
                  <RequestChangeDialog
                    bookingId={booking.id}
                    currentCheckIn={booking.checkIn}
                    currentCheckOut={booking.checkOut}
                    currentGuests={booking.guests}
                    currentTotalPriceCents={booking.totalPriceCents}
                    pricePerNightCents={booking.listing.pricePerNightCents}
                    cleaningFeeCents={booking.listing.cleaningFeeCents}
                    maxGuests={booking.listing.maxGuests}
                    otherBookedRanges={booking.listing.bookings.filter((b) => b.id !== booking.id)}
                  />
                )}

                {canCancel && (
                  <CancelBookingButton
                    bookingId={booking.id}
                    listingTitle={booking.listing.title}
                  />
                )}

                {canSeeStayDetails && (
                  <Link href={`/bookings/${booking.id}/receipt`} className={actionLinkClass}>
                    View receipt
                  </Link>
                )}

                {canSeeStayDetails && booking.listing.host.email && (
                  <a
                    href={`mailto:${booking.listing.host.email}?subject=${encodeURIComponent(
                      `Booking ${booking.reference} — ${booking.listing.title}`,
                    )}`}
                    className={actionLinkClass}
                  >
                    Contact host
                  </a>
                )}

                {canRebook && (
                  <Link href={`/listings/${booking.listingId}`} className={actionLinkClass}>
                    Rebook this stay
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <BookingSummaryCard
            listing={{
              title: booking.listing.title,
              city: booking.listing.city,
              country: booking.listing.country,
              photos: booking.listing.photos,
            }}
            checkIn={booking.checkIn}
            checkOut={booking.checkOut}
            nights={booking.nights}
            guests={booking.guests}
            nightlyPriceCents={booking.nightlyPriceCents}
            cleaningFeeCents={booking.cleaningFeeCents}
            serviceFeeCents={booking.serviceFeeCents}
            taxCents={booking.taxCents}
            totalPriceCents={booking.totalPriceCents}
            reference={booking.reference}
            guestName={booking.guestName}
            guestEmail={booking.guestEmail}
            guestPhone={booking.guestPhone}
            paymentStatus={booking.paymentStatus}
          />
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { canReviewBooking } from "@/lib/reviews";
import { canCancelBooking, canRequestBookingChange } from "@/lib/changeRequests";
import { Card } from "@/components/ui/Card";
import { Badge, type BadgeProps } from "@/components/ui/Badge";
import { StarRating } from "@/components/ui/StarRating";
import { ReviewForm } from "@/components/ReviewForm";
import { CancelBookingButton } from "@/components/CancelBookingButton";
import { RequestChangeDialog } from "@/components/RequestChangeDialog";
import { ChangeRequestStatus } from "@/components/ChangeRequestStatus";
import { isOptimizableImage } from "@/lib/image";

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

type ChangeRequestData = {
  id: string;
  status: "PENDING" | "APPROVED" | "DECLINED";
  requestedCheckIn: Date;
  requestedCheckOut: Date;
  requestedGuests: number;
  priceDeltaCents: number;
  paidAt: Date | null;
};

export function BookingCard({
  booking,
  latestChangeRequest,
}: {
  booking: {
    id: string;
    reference: string;
    listingId: string;
    status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "REFUNDED";
    checkIn: Date;
    checkOut: Date;
    guests: number;
    totalPriceCents: number;
    review: { rating: number } | null;
    listing: {
      title: string;
      city: string;
      country: string;
      photos: string[];
      pricePerNightCents: number;
      cleaningFeeCents: number;
      maxGuests: number;
      bookings: { id: string; checkIn: Date; checkOut: Date }[];
    };
  };
  latestChangeRequest: ChangeRequestData | undefined;
}) {
  // Optimistic overrides: reflect a guest action instantly, before the
  // background request (and the eventual router.refresh()) confirms it.
  const [optimisticStatus, setOptimisticStatus] = useState<typeof booking.status | null>(null);
  const [changeRequestWithdrawn, setChangeRequestWithdrawn] = useState(false);

  const status = optimisticStatus ?? booking.status;
  const effectiveBooking = { ...booking, status };
  const effectiveChangeRequest = changeRequestWithdrawn ? undefined : latestChangeRequest;

  const hasPendingChangeRequest = effectiveChangeRequest?.status === "PENDING";
  const showChangeRequestStatus =
    effectiveChangeRequest &&
    (effectiveChangeRequest.status === "PENDING" ||
      effectiveChangeRequest.status === "DECLINED" ||
      (effectiveChangeRequest.status === "APPROVED" &&
        effectiveChangeRequest.priceDeltaCents > 0 &&
        !effectiveChangeRequest.paidAt));
  const showActions =
    canCancelBooking(effectiveBooking) ||
    canRequestBookingChange(effectiveBooking, hasPendingChangeRequest);

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex gap-4 sm:min-w-0 sm:flex-1">
          <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-surface-muted">
            {booking.listing.photos[0] ? (
              <Image
                src={booking.listing.photos[0]}
                alt={booking.listing.title}
                fill
                className="object-cover"
                sizes="112px"
                unoptimized={!isOptimizableImage(booking.listing.photos[0])}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-zinc-400">
                <ImageOff className="h-5 w-5" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <Link
              href={`/listings/${booking.listingId}`}
              className="block truncate font-medium text-foreground hover:text-brand-700"
            >
              {booking.listing.title}
            </Link>
            <p className="text-sm text-zinc-500">
              {booking.listing.city}, {booking.listing.country}
            </p>
            <p className="text-sm text-zinc-500">
              {booking.checkIn.toLocaleDateString()} – {booking.checkOut.toLocaleDateString()} ·{" "}
              {booking.guests} guest{booking.guests > 1 ? "s" : ""}
            </p>
            <p className="text-xs text-zinc-400">Booking #{booking.reference}</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 sm:block sm:shrink-0 sm:text-right">
          <p className="font-semibold text-foreground">{formatPrice(booking.totalPriceCents)}</p>
          <Badge variant={statusVariant[status]} className="sm:mt-1">
            {statusLabel[status] ?? status}
          </Badge>
        </div>
      </div>

      {booking.review ? (
        <div className="flex items-center gap-1.5 text-sm text-zinc-500">
          <StarRating rating={booking.review.rating} size={14} />
          You reviewed this stay
        </div>
      ) : (
        canReviewBooking(effectiveBooking) && (
          <ReviewForm bookingId={booking.id} listingTitle={booking.listing.title} />
        )
      )}

      {showChangeRequestStatus && (
        <ChangeRequestStatus
          bookingId={booking.id}
          requestId={effectiveChangeRequest.id}
          status={effectiveChangeRequest.status}
          requestedCheckIn={effectiveChangeRequest.requestedCheckIn}
          requestedCheckOut={effectiveChangeRequest.requestedCheckOut}
          requestedGuests={effectiveChangeRequest.requestedGuests}
          priceDeltaCents={effectiveChangeRequest.priceDeltaCents}
          paidAt={effectiveChangeRequest.paidAt}
          onWithdrawn={() => setChangeRequestWithdrawn(true)}
          onWithdrawFailed={() => setChangeRequestWithdrawn(false)}
        />
      )}

      {showActions && (
        <div className="flex flex-wrap items-center gap-1 border-t border-border-subtle pt-3">
          {canRequestBookingChange(effectiveBooking, hasPendingChangeRequest) && (
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
          {canCancelBooking(effectiveBooking) && (
            <CancelBookingButton
              bookingId={booking.id}
              listingTitle={booking.listing.title}
              onCancelled={() => setOptimisticStatus("CANCELLED")}
              onCancelFailed={() => setOptimisticStatus(null)}
            />
          )}
        </div>
      )}
    </Card>
  );
}

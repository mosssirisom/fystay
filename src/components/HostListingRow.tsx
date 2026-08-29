"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CalendarDays, ImageOff, PencilLine } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { DeleteListingButton } from "@/components/DeleteListingButton";
import { ChangeRequestActions } from "@/components/ChangeRequestActions";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { isOptimizableImage } from "@/lib/image";

const bookingStatusVariant = {
  PENDING: "warning",
  CONFIRMED: "success",
  CANCELLED: "neutral",
  COMPLETED: "brand",
  REFUNDED: "neutral",
} as const;

const paymentStatusLabel: Record<string, string> = {
  UNPAID: "Unpaid",
  PAID: "Paid, not refunded",
  PARTIALLY_REFUNDED: "Partially refunded",
  REFUNDED: "Fully refunded",
};

type ChangeRequestRow = {
  id: string;
  status: "PENDING" | "APPROVED" | "DECLINED";
  requestedCheckIn: Date;
  requestedCheckOut: Date;
  requestedGuests: number;
  priceDeltaCents: number;
  originalCheckIn: Date;
  originalCheckOut: Date;
  originalGuests: number;
  originalTotalPriceCents: number;
};

export function HostListingRow({
  listing,
}: {
  listing: {
    id: string;
    title: string;
    city: string;
    country: string;
    pricePerNightCents: number;
    published: boolean;
    photos: string[];
    bookings: {
      id: string;
      checkIn: Date;
      checkOut: Date;
      guests: number;
      totalPriceCents: number;
      status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "REFUNDED";
      paymentStatus: "UNPAID" | "PAID" | "PARTIALLY_REFUNDED" | "REFUNDED";
      refundedAmountCents: number | null;
      changeRequests: ChangeRequestRow[];
    }[];
  };
}) {
  const [deleted, setDeleted] = useState(false);
  const [handledRequestIds, setHandledRequestIds] = useState<Set<string>>(new Set());
  const upcomingCount = listing.bookings.filter(
    (b) => b.status === "PENDING" || b.status === "CONFIRMED",
  ).length;

  function markHandled(requestId: string) {
    setHandledRequestIds((prev) => new Set(prev).add(requestId));
  }
  function unmarkHandled(requestId: string) {
    setHandledRequestIds((prev) => {
      const next = new Set(prev);
      next.delete(requestId);
      return next;
    });
  }

  if (deleted) return null;

  return (
    <Card className="p-4">
      <div className="flex items-start gap-4">
        <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-surface-muted">
          {listing.photos[0] ? (
            <Image
              src={listing.photos[0]}
              alt={listing.title}
              fill
              className="object-cover"
              sizes="112px"
              unoptimized={!isOptimizableImage(listing.photos[0])}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-400">
              <ImageOff className="h-5 w-5" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <Link
                href={`/listings/${listing.id}`}
                className="block truncate font-medium text-foreground hover:text-brand-700"
              >
                {listing.title}
              </Link>
              <p className="text-sm text-zinc-500">
                {listing.city}, {listing.country} · {formatPrice(listing.pricePerNightCents)}/night
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1 self-end sm:self-auto">
              <Link
                href={`/host/listings/${listing.id}/calendar`}
                className="focus-ring flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-zinc-700 hover:bg-surface-muted"
              >
                <CalendarDays className="h-4 w-4" />
                Calendar
              </Link>
              <Link
                href={`/host/listings/${listing.id}/edit`}
                className="focus-ring flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-zinc-700 hover:bg-surface-muted"
              >
                <PencilLine className="h-4 w-4" />
                Edit
              </Link>
              <DeleteListingButton
                listingId={listing.id}
                listingTitle={listing.title}
                onDeleted={() => setDeleted(true)}
                onDeleteFailed={() => setDeleted(false)}
              />
            </div>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <Badge variant={listing.published ? "success" : "neutral"}>
              {listing.published ? "Published" : "Unpublished"}
            </Badge>
            <Badge variant="brand">
              {upcomingCount} upcoming booking{upcomingCount === 1 ? "" : "s"}
            </Badge>
          </div>

          {listing.bookings.length > 0 && (
            <ul className="mt-3 flex flex-col gap-2 border-t border-border-subtle pt-3 text-sm text-zinc-600">
              {listing.bookings.map((booking) => {
                const pendingRequest = booking.changeRequests.find((cr) => cr.status === "PENDING");
                const approvedRequest = booking.changeRequests.find((cr) => cr.status === "APPROVED");
                const showRequest = pendingRequest && !handledRequestIds.has(pendingRequest.id);
                const isCancelled = booking.status === "CANCELLED" || booking.status === "REFUNDED";
                return (
                  <li key={booking.id} className="flex flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span>
                        {booking.checkIn.toLocaleDateString()} –{" "}
                        {booking.checkOut.toLocaleDateString()} · {booking.guests} guest
                        {booking.guests > 1 ? "s" : ""} · {formatPrice(booking.totalPriceCents)}
                      </span>
                      <Badge variant={bookingStatusVariant[booking.status]}>{booking.status}</Badge>
                      {approvedRequest && <Badge variant="warning">Modified</Badge>}
                    </div>

                    {approvedRequest && (
                      <p className="text-xs text-zinc-500">
                        Originally {approvedRequest.originalCheckIn.toLocaleDateString()} –{" "}
                        {approvedRequest.originalCheckOut.toLocaleDateString()} ·{" "}
                        {approvedRequest.originalGuests} guest
                        {approvedRequest.originalGuests > 1 ? "s" : ""} ·{" "}
                        {formatPrice(approvedRequest.originalTotalPriceCents)} &rarr; now{" "}
                        {formatPrice(approvedRequest.originalTotalPriceCents + approvedRequest.priceDeltaCents)}
                      </p>
                    )}

                    {isCancelled && (
                      <p className="text-xs text-zinc-500">
                        {paymentStatusLabel[booking.paymentStatus]}
                        {booking.refundedAmountCents
                          ? ` · ${formatPrice(booking.refundedAmountCents)} refunded`
                          : ""}
                      </p>
                    )}

                    {showRequest && (
                      <div className="flex flex-col gap-1.5 rounded-lg bg-surface-muted p-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-medium text-foreground">Guest requested a change</p>
                          <p>
                            New dates: {pendingRequest.requestedCheckIn.toLocaleDateString()} –{" "}
                            {pendingRequest.requestedCheckOut.toLocaleDateString()} ·{" "}
                            {pendingRequest.requestedGuests} guest
                            {pendingRequest.requestedGuests > 1 ? "s" : ""}
                          </p>
                          {pendingRequest.priceDeltaCents !== 0 && (
                            <p>
                              {pendingRequest.priceDeltaCents > 0
                                ? `Guest will owe an extra ${formatPrice(pendingRequest.priceDeltaCents)}`
                                : `Guest will be refunded ${formatPrice(Math.abs(pendingRequest.priceDeltaCents))}`}
                            </p>
                          )}
                        </div>
                        <ChangeRequestActions
                          bookingId={booking.id}
                          requestId={pendingRequest.id}
                          onOptimisticStart={() => markHandled(pendingRequest.id)}
                          onError={() => unmarkHandled(pendingRequest.id)}
                        />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </Card>
  );
}

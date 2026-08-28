import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ImageOff, Luggage } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { canReviewBooking } from "@/lib/reviews";
import { Card } from "@/components/ui/Card";
import { Badge, type BadgeProps } from "@/components/ui/Badge";
import { buttonVariants } from "@/components/ui/Button";
import { StarRating } from "@/components/ui/StarRating";
import { ReviewForm } from "@/components/ReviewForm";
import { cn } from "@/lib/cn";
import { isOptimizableImage } from "@/lib/image";

const statusVariant: Record<string, BadgeProps["variant"]> = {
  PENDING: "warning",
  CONFIRMED: "success",
  CANCELLED: "neutral",
};

export const metadata: Metadata = { title: "My trips", robots: { index: false } };

export default async function BookingsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/bookings");
  }

  const bookings = await prisma.booking.findMany({
    where: { guestId: session.user.id },
    include: { listing: true, review: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
      <h1 className="text-2xl font-bold">My trips</h1>

      {bookings.length === 0 ? (
        <Card className="mt-8 flex flex-col items-center gap-3 p-12 text-center">
          <Luggage className="h-8 w-8 text-zinc-300" />
          <p className="font-medium text-foreground">No trips booked yet</p>
          <p className="max-w-sm text-sm text-zinc-500">
            Time to dust off your bags and start planning your next adventure.
          </p>
          <Link href="/" className={cn(buttonVariants(), "mt-2")}>
            Start exploring
          </Link>
        </Card>
      ) : (
        <ul className="mt-6 flex flex-col gap-4">
          {bookings.map((booking) => (
            <Card key={booking.id} className="flex items-center gap-4 p-4">
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
                  className="truncate font-medium text-foreground hover:text-brand-700"
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
                {booking.review ? (
                  <div className="mt-2 flex items-center gap-1.5 text-sm text-zinc-500">
                    <StarRating rating={booking.review.rating} size={14} />
                    You reviewed this stay
                  </div>
                ) : (
                  canReviewBooking(booking) && (
                    <div className="mt-2">
                      <ReviewForm bookingId={booking.id} listingTitle={booking.listing.title} />
                    </div>
                  )
                )}
              </div>

              <div className="shrink-0 text-right">
                <p className="font-semibold text-foreground">
                  {formatPrice(booking.totalPriceCents)}
                </p>
                <Badge variant={statusVariant[booking.status]} className="mt-1">
                  {booking.status}
                </Badge>
              </div>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ImageOff, PencilLine, PlusCircle } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { DeleteListingButton } from "@/components/DeleteListingButton";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { isOptimizableImage } from "@/lib/image";

const bookingStatusVariant = {
  PENDING: "warning",
  CONFIRMED: "success",
  CANCELLED: "neutral",
} as const;

export const metadata: Metadata = { title: "Host dashboard" };

export default async function HostDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/host/dashboard");
  if (session.user.role !== "HOST") redirect("/");

  const listings = await prisma.listing.findMany({
    where: { hostId: session.user.id },
    include: {
      bookings: {
        where: { status: { in: ["PENDING", "CONFIRMED"] } },
        orderBy: { checkIn: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Your listings</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {listings.length} listing{listings.length === 1 ? "" : "s"}
          </p>
        </div>
        <Link href="/host/listings/new" className={cn(buttonVariants())}>
          <PlusCircle className="h-4 w-4" />
          New listing
        </Link>
      </div>

      {listings.length === 0 ? (
        <Card className="mt-8 flex flex-col items-center gap-3 p-12 text-center">
          <PlusCircle className="h-8 w-8 text-zinc-300" />
          <p className="font-medium text-foreground">No listings yet</p>
          <p className="max-w-sm text-sm text-zinc-500">
            Create your first listing to start welcoming guests.
          </p>
          <Link href="/host/listings/new" className={cn(buttonVariants(), "mt-2")}>
            Create a listing
          </Link>
        </Card>
      ) : (
        <ul className="mt-6 flex flex-col gap-4">
          {listings.map((listing) => (
            <Card key={listing.id} className="p-4">
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
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        href={`/listings/${listing.id}`}
                        className="truncate font-medium text-foreground hover:text-brand-700"
                      >
                        {listing.title}
                      </Link>
                      <p className="text-sm text-zinc-500">
                        {listing.city}, {listing.country} ·{" "}
                        {formatPrice(listing.pricePerNightCents)}/night
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Link
                        href={`/host/listings/${listing.id}/edit`}
                        className="focus-ring flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-zinc-700 hover:bg-surface-muted"
                      >
                        <PencilLine className="h-4 w-4" />
                        Edit
                      </Link>
                      <DeleteListingButton listingId={listing.id} listingTitle={listing.title} />
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant={listing.published ? "success" : "neutral"}>
                      {listing.published ? "Published" : "Unpublished"}
                    </Badge>
                    <Badge variant="brand">
                      {listing.bookings.length} upcoming booking
                      {listing.bookings.length === 1 ? "" : "s"}
                    </Badge>
                  </div>

                  {listing.bookings.length > 0 && (
                    <ul className="mt-3 flex flex-col gap-1.5 border-t border-border-subtle pt-3 text-sm text-zinc-600">
                      {listing.bookings.map((booking) => (
                        <li key={booking.id} className="flex items-center gap-2">
                          <span>
                            {booking.checkIn.toLocaleDateString()} –{" "}
                            {booking.checkOut.toLocaleDateString()} · {booking.guests} guest
                            {booking.guests > 1 ? "s" : ""}
                          </span>
                          <Badge variant={bookingStatusVariant[booking.status]}>
                            {booking.status}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}

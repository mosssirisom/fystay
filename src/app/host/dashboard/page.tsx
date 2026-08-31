import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarCheck2, PlusCircle, Star, Wallet } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { averageRating } from "@/lib/reviews";
import { computeOccupancyRate, summarizeEarnings } from "@/lib/hostStats";
import { formatPrice } from "@/lib/format";
import { HostListingRow } from "@/components/HostListingRow";
import { NeedsAttention, type PendingChangeRequest } from "@/components/host/NeedsAttention";
import { StatCard } from "@/components/host/StatCard";
import { Card } from "@/components/ui/Card";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Host dashboard", robots: { index: false } };

export default async function HostDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/host/dashboard");
  if (session.user.role !== "HOST") redirect("/");

  const listings = await prisma.listing.findMany({
    where: { hostId: session.user.id },
    include: {
      // Upcoming bookings plus recently cancelled ones, so a host can see
      // what got cancelled (and any refund) without them ever disappearing
      // from the dashboard the moment they're no longer active.
      bookings: {
        where: { status: { in: ["PENDING", "CONFIRMED", "CANCELLED", "REFUNDED"] } },
        include: { changeRequests: { orderBy: { createdAt: "desc" } } },
        orderBy: { checkIn: "asc" },
      },
      reviews: { where: { status: "PUBLISHED" }, select: { rating: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  const allBookings = listings.flatMap((l) => l.bookings);
  const earnings = summarizeEarnings(allBookings, now);
  const occupancyRate = computeOccupancyRate({
    listings: listings.map((l) => ({ id: l.id, published: l.published })),
    bookings: allBookings,
    referenceDate: now,
  });
  const allReviews = listings.flatMap((l) => l.reviews);
  const overallRating = averageRating(allReviews);

  const pendingRequests: PendingChangeRequest[] = listings.flatMap((listing) =>
    listing.bookings.flatMap((booking) =>
      booking.changeRequests
        .filter((cr) => cr.status === "PENDING")
        .map((cr) => ({
          id: cr.id,
          bookingId: booking.id,
          listingId: listing.id,
          listingTitle: listing.title,
          requestedCheckIn: cr.requestedCheckIn,
          requestedCheckOut: cr.requestedCheckOut,
          requestedGuests: cr.requestedGuests,
          priceDeltaCents: cr.priceDeltaCents,
        })),
    ),
  );

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Host dashboard</h1>
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
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              icon={Wallet}
              label="Total earnings"
              value={formatPrice(earnings.totalCents)}
              sublabel="All time"
            />
            <StatCard
              icon={Wallet}
              label="This month"
              value={formatPrice(earnings.thisMonthCents)}
              sublabel="By check-in"
            />
            <StatCard
              icon={CalendarCheck2}
              label="Occupancy"
              value={occupancyRate === null ? "—" : `${occupancyRate}%`}
              sublabel="Next 30 days"
            />
            <StatCard
              icon={Star}
              label="Rating"
              value={overallRating === null ? "—" : overallRating.toFixed(1)}
              sublabel={`${allReviews.length} review${allReviews.length === 1 ? "" : "s"}`}
            />
          </div>

          <NeedsAttention requests={pendingRequests} />

          <div className="mt-8">
            <h2 className="text-lg font-bold text-foreground">Your listings</h2>
            <ul className="mt-3 flex flex-col gap-4">
              {listings.map((listing) => {
                const revenue = summarizeEarnings(listing.bookings, now);
                const listingOccupancy = computeOccupancyRate({
                  listings: [{ id: listing.id, published: listing.published }],
                  bookings: listing.bookings,
                  referenceDate: now,
                });
                return (
                  <HostListingRow
                    key={listing.id}
                    listing={listing}
                    stats={{
                      avgRating: averageRating(listing.reviews),
                      reviewCount: listing.reviews.length,
                      occupancyRate: listingOccupancy,
                      revenueThisMonthCents: revenue.thisMonthCents,
                    }}
                  />
                );
              })}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

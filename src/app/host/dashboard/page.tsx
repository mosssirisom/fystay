import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarCheck2, CreditCard, Home, PlusCircle, Star, Wallet } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { averageRating } from "@/lib/reviews";
import { computeOccupancyRate, summarizeEarnings } from "@/lib/hostStats";
import { expireStaleBookingRequests } from "@/lib/bookingLifecycle";
import { isConnectReady } from "@/lib/stripeConnect";
import { formatPrice } from "@/lib/format";
import { HostListingRow } from "@/components/HostListingRow";
import { NeedsAttention, type AttentionItem } from "@/components/host/NeedsAttention";
import { SecurityDeposits, type AuthorizedDeposit } from "@/components/host/SecurityDeposits";
import { StatCard } from "@/components/host/StatCard";
import { SectionHeading } from "@/components/SectionHeading";
import { Card } from "@/components/ui/Card";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Host dashboard", robots: { index: false } };

export default async function HostDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/host/dashboard");
  if (session.user.role !== "HOST") redirect("/");

  await expireStaleBookingRequests(prisma, { hostId: session.user.id });

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

  const host = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: {
      stripeConnectAccountId: true,
      stripeConnectChargesEnabled: true,
      stripeConnectPayoutsEnabled: true,
    },
  });
  const payoutsReady = isConnectReady(host);

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

  const pendingChangeRequests: AttentionItem[] = listings.flatMap((listing) =>
    listing.bookings.flatMap((booking) =>
      booking.changeRequests
        .filter((cr) => cr.status === "PENDING")
        .map((cr) => ({
          kind: "change" as const,
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
  const pendingBookingRequests: AttentionItem[] = listings.flatMap((listing) =>
    listing.bookings
      .filter((booking) => booking.approvalStatus === "AWAITING")
      .map((booking) => ({
        kind: "booking" as const,
        id: booking.id,
        listingId: listing.id,
        listingTitle: listing.title,
        guestName: booking.guestName,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        guests: booking.guests,
        totalPriceCents: booking.totalPriceCents,
      })),
  );
  const pendingRequests: AttentionItem[] = [...pendingBookingRequests, ...pendingChangeRequests];

  // A separate query, not derived from the status-filtered `bookings`
  // relation above: an AUTHORIZED deposit hold is just as real on a
  // COMPLETED booking (the common case - the stay already happened by the
  // time a host would file a claim) as on a CONFIRMED one, and status
  // filtering there would silently drop it from this list the moment
  // completePastBookings flips it over.
  const authorizedDeposits = await prisma.booking.findMany({
    where: { listing: { hostId: session.user.id }, depositStatus: "AUTHORIZED" },
    include: { listing: { select: { id: true, title: true } } },
    orderBy: { depositClaimDeadline: "asc" },
  });
  const deposits: AuthorizedDeposit[] = authorizedDeposits.map((booking) => ({
    bookingId: booking.id,
    listingId: booking.listing.id,
    listingTitle: booking.listing.title,
    guestName: booking.guestName,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    securityDepositCents: booking.securityDepositCents,
    depositClaimDeadline: booking.depositClaimDeadline ?? booking.checkOut,
  }));

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Host dashboard</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {listings.length} listing{listings.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/host/payouts" className={cn(buttonVariants({ variant: "outline" }))}>
            <CreditCard className="h-4 w-4" />
            Payouts
          </Link>
          <Link href="/host/listings/new" className={cn(buttonVariants())}>
            <PlusCircle className="h-4 w-4" />
            New listing
          </Link>
        </div>
      </div>

      {!payoutsReady && (
        <Card className="mt-4 flex flex-wrap items-center justify-between gap-3 border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-900">
            {host.stripeConnectAccountId
              ? "Finish connecting Stripe to start receiving payouts automatically."
              : "Connect a Stripe account so guest payments pay you out directly."}
          </p>
          <Link
            href="/host/payouts"
            className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "shrink-0")}
          >
            {host.stripeConnectAccountId ? "Finish onboarding" : "Connect with Stripe"}
          </Link>
        </Card>
      )}

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
          <SecurityDeposits deposits={deposits} />

          <div className="mt-8">
            <SectionHeading icon={Home}>Your listings</SectionHeading>
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

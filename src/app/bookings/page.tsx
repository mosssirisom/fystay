import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Luggage } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { blockingBookingWhere } from "@/lib/availability";
import { completePastBookings } from "@/lib/bookingLifecycle";
import { Card } from "@/components/ui/Card";
import { buttonVariants } from "@/components/ui/Button";
import { BookingCard } from "@/components/BookingCard";
import { BookingsTabs } from "@/components/BookingsTabs";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "My trips", robots: { index: false } };

function EmptySection({
  message,
  hint,
  showCta,
}: {
  message: string;
  hint: string;
  showCta?: boolean;
}) {
  return (
    <Card className="flex flex-col items-center gap-3 p-12 text-center">
      <Luggage className="h-8 w-8 text-zinc-300" />
      <p className="font-medium text-foreground">{message}</p>
      <p className="max-w-sm text-sm text-zinc-500">{hint}</p>
      {showCta && (
        <Link href="/" className={cn(buttonVariants(), "mt-2")}>
          Start exploring
        </Link>
      )}
    </Card>
  );
}

export default async function BookingsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/bookings");
  }

  await completePastBookings(prisma, session.user.id);

  const bookings = await prisma.booking.findMany({
    where: { guestId: session.user.id },
    include: {
      listing: {
        include: {
          bookings: {
            where: blockingBookingWhere(),
            select: { id: true, checkIn: true, checkOut: true },
          },
        },
      },
      review: true,
      changeRequests: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  if (bookings.length === 0) {
    return (
      <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
        <h1 className="text-2xl font-bold">My trips</h1>
        <div className="mt-8">
          <EmptySection
            message="No trips booked yet"
            hint="Time to dust off your bags and start planning your next adventure."
            showCta
          />
        </div>
      </div>
    );
  }

  // completePastBookings above already keeps status truthful against the
  // current date, so bucketing by status alone (no extra date math here) is
  // enough to sort these into the right section.
  const upcoming = bookings
    .filter((b) => b.status === "PENDING" || b.status === "CONFIRMED")
    .sort((a, b) => a.checkIn.getTime() - b.checkIn.getTime());
  const past = bookings
    .filter((b) => b.status === "COMPLETED")
    .sort((a, b) => b.checkOut.getTime() - a.checkOut.getTime());
  const cancelled = bookings
    .filter((b) => b.status === "CANCELLED" || b.status === "REFUNDED")
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

  function renderSection(
    list: typeof bookings,
    emptyMessage: string,
    emptyHint: string,
    showCta?: boolean,
  ) {
    if (list.length === 0) {
      return <EmptySection message={emptyMessage} hint={emptyHint} showCta={showCta} />;
    }
    return (
      <ul className="flex flex-col gap-4">
        {list.map((booking) => (
          <li key={booking.id}>
            <BookingCard booking={booking} latestChangeRequest={booking.changeRequests[0]} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
      <h1 className="text-2xl font-bold">My trips</h1>

      <BookingsTabs
        counts={{ upcoming: upcoming.length, past: past.length, cancelled: cancelled.length }}
        upcoming={renderSection(
          upcoming,
          "No upcoming trips",
          "Browse stays along the Fylde coast and book your next getaway.",
          true,
        )}
        past={renderSection(
          past,
          "No past trips yet",
          "Your completed stays will show up here once they're done.",
        )}
        cancelled={renderSection(
          cancelled,
          "No cancelled bookings",
          "Any reservations you cancel will appear here.",
        )}
      />
    </div>
  );
}

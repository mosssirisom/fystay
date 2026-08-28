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
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "My trips", robots: { index: false } };

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
            <BookingCard
              key={booking.id}
              booking={booking}
              latestChangeRequest={booking.changeRequests[0]}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

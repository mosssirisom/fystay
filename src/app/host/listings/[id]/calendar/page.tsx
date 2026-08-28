import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AvailabilityCalendar } from "@/components/AvailabilityCalendar";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const listing = await prisma.listing.findUnique({ where: { id }, select: { title: true } });
  return {
    title: listing ? `Calendar · ${listing.title}` : "Availability calendar",
    robots: { index: false },
  };
}

export default async function ListingCalendarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=/host/listings/${id}/calendar`);

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      bookings: {
        where: { status: { in: ["PENDING", "CONFIRMED"] } },
        select: {
          id: true,
          checkIn: true,
          checkOut: true,
          status: true,
          guests: true,
          guestName: true,
          reference: true,
        },
        orderBy: { checkIn: "asc" },
      },
      availabilityBlocks: {
        orderBy: { startDate: "asc" },
      },
    },
  });
  if (!listing) notFound();
  if (listing.hostId !== session.user.id) redirect("/host/dashboard");

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
      <Link
        href="/host/dashboard"
        className="focus-ring -ml-1 inline-flex items-center gap-1 rounded-lg py-1 pr-2 text-sm font-medium text-zinc-600 hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to dashboard
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-foreground">{listing.title}</h1>
      <p className="mt-1 text-sm text-zinc-500">Availability calendar</p>

      <AvailabilityCalendar
        listingId={listing.id}
        bookings={listing.bookings}
        blocks={listing.availabilityBlocks}
      />
    </div>
  );
}

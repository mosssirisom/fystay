import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { BookingConfirmation } from "@/components/BookingConfirmation";

export const metadata: Metadata = { title: "Booking confirmed", robots: { index: false } };

export default async function BookingConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    redirect(`/login?callbackUrl=/bookings/${id}/confirmation`);
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { listing: true },
  });

  if (!booking || booking.guestId !== session.user.id) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
      <BookingConfirmation
        bookingId={booking.id}
        initialStatus={booking.status}
        initialPaymentStatus={booking.paymentStatus}
        reference={booking.reference}
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
        guestName={booking.guestName}
        guestEmail={booking.guestEmail}
        guestPhone={booking.guestPhone}
      />
    </div>
  );
}

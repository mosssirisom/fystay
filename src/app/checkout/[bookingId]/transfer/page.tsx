import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getActiveOfferingByCategory } from "@/lib/travelAddons";
import { TransferStepCard } from "@/components/travel-extras/TransferStepCard";

export const metadata: Metadata = { title: "Complete your trip", robots: { index: false } };

/**
 * The optional "Complete your trip" step between reserving a stay and
 * paying for it (item 3 of the cross-sell brief) - BookingWidget and
 * HotelBookingWidget redirect here instead of straight to /checkout/[id]
 * once a reservation is created. Same gating as the checkout page itself
 * (see src/app/checkout/[bookingId]/page.tsx) since a guest can land here
 * directly from a stale link too - anything that isn't a fresh, payable
 * PENDING booking skips straight past this step rather than showing an
 * upsell for a booking that's no longer actionable.
 */
export default async function TransferStepPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  const session = await auth();
  if (!session?.user) {
    redirect(`/login?callbackUrl=/checkout/${bookingId}/transfer`);
  }

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.guestId !== session.user.id) {
    notFound();
  }

  if (booking.status !== "PENDING" || booking.approvalStatus === "AWAITING") {
    redirect(`/checkout/${booking.id}`);
  }

  const offering = await getActiveOfferingByCategory("AIRPORT_TRANSFER");
  if (!offering) {
    redirect(`/checkout/${booking.id}`);
  }

  return <TransferStepCard offering={offering} checkoutHref={`/checkout/${booking.id}`} />;
}

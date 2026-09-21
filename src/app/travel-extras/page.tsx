import type { Metadata } from "next";
import Link from "next/link";
import { Compass } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/Button";
import { getActiveOfferingByCategory } from "@/lib/travelAddons";
import { TravelAddonLanding } from "@/components/travel-extras/TravelAddonLanding";
import { cn } from "@/lib/cn";
import type { ExtraCategory } from "@prisma/client";

const CATEGORIES: ExtraCategory[] = ["AIRPORT_TRANSFER", "ATTRACTION_TICKET", "CAR_HIRE"];

export const metadata: Metadata = { title: "Travel extras" };

type SearchParams = { category?: string };

/**
 * One generic landing page for whichever travel add-on category a CTA
 * points to (see src/lib/travelAddons.ts's travelAddonHref) - EV Exec's
 * airport transfer is the first, but this same page serves any future
 * ExtraCategory without a new route (see item 7 of the cross-sell brief).
 */
export default async function TravelExtrasPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolved = await searchParams;
  const category = CATEGORIES.includes(resolved.category as ExtraCategory)
    ? (resolved.category as ExtraCategory)
    : "AIRPORT_TRANSFER";

  const offering = await getActiveOfferingByCategory(category);

  if (!offering) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center px-6 py-16 text-center">
        <Compass className="h-8 w-8 text-stone-400" aria-hidden />
        <h1 className="mt-4 text-xl font-semibold text-foreground">Nothing available right now</h1>
        <p className="mt-2 max-w-sm text-sm text-stone-500">
          There&apos;s no travel extra live in this category yet. Check back soon.
        </p>
        <Link href="/" className={cn(buttonVariants({ variant: "outline" }), "mt-6")}>
          Back to FYStay
        </Link>
      </div>
    );
  }

  const session = await auth();
  const eligibleBooking = session?.user
    ? await prisma.booking.findFirst({
        where: { guestId: session.user.id, status: { in: ["CONFIRMED", "COMPLETED"] } },
        orderBy: { checkIn: "desc" },
        select: { id: true },
      })
    : null;

  return <TravelAddonLanding offering={offering} eligibleBookingId={eligibleBooking?.id ?? null} />;
}

"use client";

import Link from "next/link";
import { Check, Plane } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { buttonVariants } from "@/components/ui/Button";
import { trackAddonEvent } from "@/lib/analytics";
import { useViewOnce } from "@/hooks/useViewOnce";
import { cn } from "@/lib/cn";
import type { TravelAddonOffering } from "@/lib/travelAddons";

/**
 * "Complete your trip" - the optional pre-checkout step (item 3 of the
 * cross-sell brief in docs/trip-extras-roadmap.md), shown once between
 * reserving a stay and paying for it. Both buttons continue to the same
 * checkout page - buying the transfer itself always happens afterward,
 * once the stay is actually confirmed and paid (see tripExtraPurchaseError
 * in src/lib/tripExtras.ts for why: a transfer charged against a stay that
 * never completes payment has nowhere to go). This step is deliberately
 * just intent-capture + a clear "skip is fine" - the real purchase moment
 * is the confirmation-page nudge (see AirportTransferNudge).
 */
export function TransferStepCard({
  offering,
  checkoutHref,
}: {
  offering: TravelAddonOffering;
  checkoutHref: string;
}) {
  const viewRef = useViewOnce<HTMLDivElement>(() => {
    trackAddonEvent({
      name: "transfer_offer_viewed",
      category: offering.category,
      surface: "booking_flow",
      offeringId: offering.id,
    });
  });

  function handleAdd() {
    // Distinct from the server-fired "transfer_added" event (only recorded
    // once a purchase actually completes - see src/lib/analytics.ts's own
    // comment) - this is just the pre-checkout click, no money moved yet.
    trackAddonEvent({
      name: "transfer_intent_added",
      category: offering.category,
      surface: "booking_flow",
      offeringId: offering.id,
    });
  }

  function handleSkip() {
    trackAddonEvent({
      name: "transfer_skipped",
      category: offering.category,
      surface: "booking_flow",
      offeringId: offering.id,
    });
  }

  return (
    <div ref={viewRef} className="mx-auto w-full max-w-xl flex-1 px-6 py-10">
      <h1 className="text-2xl font-bold text-foreground">Complete your trip</h1>
      <p className="mt-1 text-sm text-stone-500">Would you like to arrange your airport transfer?</p>

      <Card className="mt-6">
        <CardContent className="flex flex-col gap-4 p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
              <Plane className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="font-semibold text-foreground">{offering.name}</p>
              <p className="text-sm text-stone-500">Provided by {offering.providerName}</p>
            </div>
          </div>

          {offering.description && <p className="text-sm text-stone-600">{offering.description}</p>}

          {offering.features.length > 0 && (
            <ul className="flex flex-col gap-2">
              {offering.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-stone-600">
                  <Check className="h-4 w-4 shrink-0 text-brand-600" aria-hidden />
                  {feature}
                </li>
              ))}
            </ul>
          )}

          <p className="text-lg font-bold text-foreground">
            £{(offering.priceCents / 100).toFixed(2)}
          </p>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href={checkoutHref}
              onClick={handleAdd}
              className={cn(buttonVariants(), "flex-1 justify-center")}
            >
              Add airport transfer
            </Link>
            <Link
              href={checkoutHref}
              onClick={handleSkip}
              className={cn(buttonVariants({ variant: "outline" }), "flex-1 justify-center")}
            >
              Skip for now
            </Link>
          </div>
          <p className="text-center text-xs text-stone-500">
            Optional - you can add this any time from your booking once it&apos;s confirmed.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

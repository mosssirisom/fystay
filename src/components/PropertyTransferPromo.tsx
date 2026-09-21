"use client";

import Link from "next/link";
import { Plane } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { buttonVariants } from "@/components/ui/Button";
import { trackAddonEvent } from "@/lib/analytics";
import { useViewOnce } from "@/hooks/useViewOnce";
import { cn } from "@/lib/cn";
import { travelAddonHref, type TravelAddonOffering } from "@/lib/travelAddons";

/**
 * "Arriving by air?" - the property-page cross-sell (item 2 of the
 * cross-sell brief in docs/trip-extras-roadmap.md), shown right next to
 * the booking widget rather than competing with it: a plain bordered
 * card, no gradient, the same weight as WhyBookWithFYStay above it on
 * this page, not a second call to action fighting "Reserve".
 */
export function PropertyTransferPromo({ offering }: { offering: TravelAddonOffering }) {
  const viewRef = useViewOnce<HTMLDivElement>(() => {
    trackAddonEvent({
      name: "transfer_offer_viewed",
      category: offering.category,
      surface: "property_page",
      offeringId: offering.id,
    });
  });

  function handleCtaClick() {
    trackAddonEvent({
      name: "transfer_offer_clicked",
      category: offering.category,
      surface: "property_page",
      offeringId: offering.id,
    });
  }

  return (
    <div ref={viewRef}>
      <Card className="mt-4 p-0">
        <CardContent className="flex flex-col gap-3 p-5">
          <div className="flex items-center gap-2 text-brand-700">
            <Plane className="h-4 w-4" aria-hidden />
            <p className="text-sm font-semibold">Arriving by air?</p>
          </div>
          <p className="text-sm text-stone-600">
            Make the journey from the airport effortless with {offering.providerName}.
          </p>
          {offering.features.length > 0 && (
            <p className="text-xs text-stone-500">{offering.features.join(" • ")}</p>
          )}
          <Link
            href={travelAddonHref(offering.category)}
            onClick={handleCtaClick}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "self-start")}
          >
            View transfer options
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

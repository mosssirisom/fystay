"use client";

import Link from "next/link";
import { Plane } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { buttonVariants } from "@/components/ui/Button";
import { formatPrice } from "@/lib/format";
import { trackAddonEvent } from "@/lib/analytics";
import { useViewOnce } from "@/hooks/useViewOnce";
import { cn } from "@/lib/cn";
import { travelAddonHref, type TravelAddonContext, type TravelAddonOffering } from "@/lib/travelAddons";

export type EvExecCrossSellContext = TravelAddonContext;

/**
 * A quiet, optional-service promo for EV Exec's airport transfer, built to
 * live inside journeys that PropertyTransferPromo/TravelAddonsSection don't
 * reach - specifically the hotel affiliate journey (Phase 9's own brief),
 * but written generically (an `offering` + `context` + a caller-supplied
 * `surface` string) so any future surface can render this same card rather
 * than each one inventing its own transfer promo. Deliberately its own
 * component rather than a reuse of PropertyTransferPromo: this one carries
 * trip context through to /travel-extras (see travelAddonHref) and fires
 * its own ev_exec_cross_sell_impression/click events, kept separate from
 * that component's transfer_offer_viewed/clicked so a report never
 * conflates the two journeys (see analytics.ts's own comment on why).
 *
 * Styled like PropertyTransferPromo on purpose - the same plain bordered
 * Card, the same brand-tinted icon circle, an outline button at the same
 * weight as a secondary link, never the primary "Book now" button's own
 * filled brand-700 style - so it reads as a courteous suggestion sitting
 * beside the real booking action, not a competing ad.
 */
export function EvExecCrossSellCard({
  offering,
  context,
  surface,
}: {
  offering: TravelAddonOffering;
  context?: EvExecCrossSellContext;
  surface: string;
}) {
  const viewRef = useViewOnce<HTMLDivElement>(() => {
    trackAddonEvent({
      name: "ev_exec_cross_sell_impression",
      category: offering.category,
      surface,
      offeringId: offering.id,
      metadata: { destination: context?.destination ?? null },
    });
  });

  function handleCtaClick() {
    trackAddonEvent({
      name: "ev_exec_cross_sell_click",
      category: offering.category,
      surface,
      offeringId: offering.id,
      metadata: { destination: context?.destination ?? null },
    });
  }

  return (
    <div ref={viewRef}>
      <Card className="p-0">
        <CardContent className="flex flex-col gap-3 p-5">
          <div className="flex items-center gap-2 text-brand-700">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50">
              <Plane className="h-4 w-4" aria-hidden />
            </span>
            <p className="text-sm font-semibold">Optional: airport transfer</p>
          </div>
          <p className="text-sm text-stone-600">
            Flying in{context?.destination ? ` for ${context.destination}` : ""}? {offering.providerName}{" "}
            offers a fixed-price transfer - a separate, optional service you can book independently of this
            hotel deal.
          </p>
          <div className="flex items-center justify-between text-xs text-stone-500">
            {offering.features.length > 0 && <span>{offering.features.join(" · ")}</span>}
            <span className="font-semibold text-stone-700">{formatPrice(offering.priceCents)}</span>
          </div>
          <Link
            href={travelAddonHref(offering.category, context)}
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

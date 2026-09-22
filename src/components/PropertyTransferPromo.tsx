"use client";

import Link from "next/link";
import { KeyRound, Plane, Ticket as TicketIcon, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { buttonVariants } from "@/components/ui/Button";
import { trackAddonEvent } from "@/lib/analytics";
import { useViewOnce } from "@/hooks/useViewOnce";
import { cn } from "@/lib/cn";
import { travelAddonHref, type TravelAddonOffering } from "@/lib/travelAddons";
import type { ExtraCategory } from "@prisma/client";

const CATEGORY_COPY: Record<
  ExtraCategory,
  { icon: LucideIcon; eyebrow: string; blurb: (providerName: string) => string; cta: string }
> = {
  AIRPORT_TRANSFER: {
    icon: Plane,
    eyebrow: "Arriving by air?",
    blurb: (providerName) => `Make the journey from the airport effortless with ${providerName}.`,
    cta: "View transfer options",
  },
  ATTRACTION_TICKET: {
    icon: TicketIcon,
    eyebrow: "Make it a trip",
    blurb: (providerName) => `Add a local attraction ticket from ${providerName} to your stay.`,
    cta: "View attraction tickets",
  },
  CAR_HIRE: {
    icon: KeyRound,
    eyebrow: "Need a car?",
    blurb: (providerName) => `Hire a car for your stay through ${providerName}.`,
    cta: "View car hire options",
  },
};

/**
 * The property-page cross-sell (item 2 of the cross-sell brief in
 * docs/trip-extras-roadmap.md), shown right next to the booking widget
 * rather than competing with it: a plain bordered card, no gradient, the
 * same weight as WhyBookWithFYStay above it on this page, not a second
 * call to action fighting "Reserve". Generic over `offering.category` (see
 * src/lib/travelAddons.ts's getFeaturedOffering) rather than hardcoded to
 * airport transfers.
 */
export function PropertyTransferPromo({ offering }: { offering: TravelAddonOffering }) {
  const copy = CATEGORY_COPY[offering.category];
  const Icon = copy.icon;
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
            <Icon className="h-4 w-4" aria-hidden />
            <p className="text-sm font-semibold">{copy.eyebrow}</p>
          </div>
          <p className="text-sm text-stone-600">{copy.blurb(offering.providerName)}</p>
          {offering.features.length > 0 && (
            <p className="text-xs text-stone-500">{offering.features.join(" • ")}</p>
          )}
          <Link
            href={travelAddonHref(offering.category)}
            onClick={handleCtaClick}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "self-start")}
          >
            {copy.cta}
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

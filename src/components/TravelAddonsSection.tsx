"use client";

import Link from "next/link";
import { CarFront } from "lucide-react";
import { buttonVariants } from "@/components/ui/Button";
import { trackAddonEvent } from "@/lib/analytics";
import { useViewOnce } from "@/hooks/useViewOnce";
import { cn } from "@/lib/cn";
import { travelAddonHref, type TravelAddonOffering } from "@/lib/travelAddons";

/**
 * The homepage's one, quiet travel-add-on cross-sell (see item 1 of the
 * cross-sell brief in docs/trip-extras-roadmap.md) - a single compact
 * card, not a hero-sized banner, so accommodation stays the obvious point
 * of the page. Deliberately generic over `offering` the same way every
 * other cross-sell surface is (see src/lib/travelAddons.ts): today this
 * always renders the EV Exec airport transfer because that's the only
 * active AIRPORT_TRANSFER offering, but nothing here hardcodes that name.
 */
export function TravelAddonsSection({ offering }: { offering: TravelAddonOffering }) {
  const viewRef = useViewOnce<HTMLDivElement>(() => {
    trackAddonEvent({
      name: "transfer_offer_viewed",
      category: offering.category,
      surface: "homepage",
      offeringId: offering.id,
    });
  });

  function handleCtaClick() {
    trackAddonEvent({
      name: "transfer_offer_clicked",
      category: offering.category,
      surface: "homepage",
      offeringId: offering.id,
    });
  }

  return (
    <div
      ref={viewRef}
      className="flex flex-col items-center gap-4 rounded-2xl border border-border-subtle bg-surface p-6 shadow-[var(--shadow-card)] sm:flex-row sm:justify-between"
    >
      <div className="flex items-start gap-4 text-center sm:text-left">
        <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 sm:flex">
          <CarFront className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
            Complete your journey
          </p>
          <h2 className="mt-1 text-lg font-bold text-foreground">
            Premium electric airport transfers with {offering.providerName}.
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            Travel door-to-door in comfort with a Tesla.
          </p>
        </div>
      </div>
      <Link
        href={travelAddonHref(offering.category)}
        onClick={handleCtaClick}
        className={cn(buttonVariants({ variant: "outline" }), "shrink-0")}
      >
        Add an airport transfer
      </Link>
    </div>
  );
}

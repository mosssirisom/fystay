"use client";

import Link from "next/link";
import { CarFront, KeyRound, Ticket as TicketIcon, type LucideIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/Button";
import { trackAddonEvent } from "@/lib/analytics";
import { useViewOnce } from "@/hooks/useViewOnce";
import { cn } from "@/lib/cn";
import { travelAddonHref, type TravelAddonOffering } from "@/lib/travelAddons";
import type { ExtraCategory } from "@prisma/client";

const CATEGORY_COPY: Record<
  ExtraCategory,
  { icon: LucideIcon; heading: (providerName: string) => string; blurb: string; cta: string }
> = {
  AIRPORT_TRANSFER: {
    icon: CarFront,
    heading: (providerName) => `Premium electric airport transfers with ${providerName}.`,
    blurb: "Travel door-to-door in comfort with a Tesla.",
    cta: "Add an airport transfer",
  },
  ATTRACTION_TICKET: {
    icon: TicketIcon,
    heading: (providerName) => `Skip the queue with ${providerName}.`,
    blurb: "Book a local attraction ticket alongside your stay.",
    cta: "Browse attraction tickets",
  },
  CAR_HIRE: {
    icon: KeyRound,
    heading: (providerName) => `Need wheels? ${providerName} has you covered.`,
    blurb: "Hire a car for the length of your stay.",
    cta: "Browse car hire",
  },
};

/**
 * The homepage's one, quiet travel-add-on cross-sell (see item 1 of the
 * cross-sell brief in docs/trip-extras-roadmap.md) - a single compact
 * card, not a hero-sized banner, so accommodation stays the obvious point
 * of the page. Generic over `offering.category` (see src/lib/travelAddons.ts's
 * getFeaturedOffering) rather than hardcoded to airport transfers, so a real
 * attraction/car-hire offering surfaces here too once one is the featured one.
 */
export function TravelAddonsSection({ offering }: { offering: TravelAddonOffering }) {
  const copy = CATEGORY_COPY[offering.category];
  const Icon = copy.icon;
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
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
            Complete your journey
          </p>
          <h2 className="mt-1 text-lg font-bold text-foreground">
            {copy.heading(offering.providerName)}
          </h2>
          <p className="mt-1 text-sm text-stone-500">{copy.blurb}</p>
        </div>
      </div>
      <Link
        href={travelAddonHref(offering.category)}
        onClick={handleCtaClick}
        className={cn(buttonVariants({ variant: "outline" }), "shrink-0")}
      >
        {copy.cta}
      </Link>
    </div>
  );
}

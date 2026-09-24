"use client";

import { useRef } from "react";
import { ChevronRight } from "lucide-react";
import { formatProviderPrice } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { useReserveBottomSpace } from "@/hooks/useReserveBottomSpace";

/**
 * The hotel-detail equivalent of MobileBookingBar (FYStay's own listing
 * page) - on mobile, the deals card sits below the photos/description/
 * facilities, so without this a guest would have to scroll past all of
 * that to find a price or a way to book. A sticky footer keeps a price (the
 * cheapest live deal found, if any) and one way in always visible,
 * scrolling to the real deals card rather than duplicating its content or
 * navigating away.
 */
export function HotelMobileBookingBar({
  lowestPriceCents,
  currency,
  targetId,
}: {
  /** null when availability hasn't returned any bookable deal (sold out, or the provider couldn't be reached) - the bar still offers a way to see why, just without a price to show. */
  lowestPriceCents: number | null;
  currency: string;
  targetId: string;
}) {
  const barRef = useRef<HTMLDivElement>(null);
  useReserveBottomSpace(barRef);

  function scrollToDeals() {
    document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div
      ref={barRef}
      className="fixed inset-x-0 bottom-0 z-10 flex items-center justify-between gap-4 border-t border-border-subtle bg-surface px-4 py-3 shadow-[var(--shadow-popover)] [padding-bottom:calc(env(safe-area-inset-bottom)+0.75rem)] lg:hidden"
    >
      {lowestPriceCents != null ? (
        <p className="text-base text-foreground">
          <span className="text-xs text-stone-500">From</span>{" "}
          <span className="font-bold text-brand-800">{formatProviderPrice(lowestPriceCents, currency)}</span>{" "}
          <span className="text-sm text-stone-500">/ night</span>
        </p>
      ) : (
        <p className="text-sm text-stone-500">Check live availability</p>
      )}
      <Button onClick={scrollToDeals} size="lg">
        View deals
        <ChevronRight className="h-4 w-4" aria-hidden />
      </Button>
    </div>
  );
}

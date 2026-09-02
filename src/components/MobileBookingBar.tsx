"use client";

import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/Button";

/**
 * On mobile the booking widget sits below the description, amenities, and
 * reviews, so without this a guest would have to scroll back up to start a
 * reservation. A sticky footer keeps the price and a way in always visible,
 * matching how the on-page widget already looks and behaves.
 */
export function MobileBookingBar({ pricePerNightCents }: { pricePerNightCents: number }) {
  function scrollToWidget() {
    document.getElementById("booking-widget")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-10 flex items-center justify-between gap-4 border-t border-border-subtle bg-surface px-4 py-3 shadow-[var(--shadow-popover)] [padding-bottom:calc(env(safe-area-inset-bottom)+0.75rem)] lg:hidden">
      <p className="text-base text-foreground">
        <span className="font-bold text-brand-800">{formatPrice(pricePerNightCents)}</span>{" "}
        <span className="text-sm text-zinc-500">/ night</span>
      </p>
      <Button onClick={scrollToWidget} size="lg">
        Check availability
      </Button>
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/Button";

/**
 * On mobile the booking widget sits below the description, amenities, and
 * reviews, so without this a guest would have to scroll back up to start a
 * reservation. A sticky footer keeps the price and a way in always visible,
 * matching how the on-page widget already looks and behaves.
 */
export function MobileBookingBar({ pricePerNightCents }: { pricePerNightCents: number }) {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    // This bar is position:fixed, so it always sits over the true bottom
    // of the *viewport*, not the bottom of this page's own content - any
    // padding added further up the page (e.g. after the booking widget)
    // only stops it covering content in the middle of the page, not the
    // shared Footer that renders after every page's own content. Reserving
    // real space on <body> itself, sized to the bar's own rendered height,
    // is what actually keeps the last few rows of the Footer (its legal
    // links) from ending up permanently hidden behind this bar once a
    // guest scrolls all the way down. A ResizeObserver (rather than a
    // fixed pixel value, or reading the height once) means this self-
    // corrects if the bar's height ever changes, including collapsing to
    // 0 via its own lg:hidden once the viewport crosses into desktop width.
    const observer = new ResizeObserver(() => {
      document.body.style.paddingBottom = `${bar.offsetHeight}px`;
    });
    observer.observe(bar);
    return () => {
      observer.disconnect();
      document.body.style.paddingBottom = "";
    };
  }, []);

  function scrollToWidget() {
    document.getElementById("booking-widget")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div
      ref={barRef}
      className="fixed inset-x-0 bottom-0 z-10 flex items-center justify-between gap-4 border-t border-border-subtle bg-surface px-4 py-3 shadow-[var(--shadow-popover)] [padding-bottom:calc(env(safe-area-inset-bottom)+0.75rem)] lg:hidden"
    >
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

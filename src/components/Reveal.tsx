"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Fades/slides a section in the first time it scrolls into view - purely a
 * homepage polish touch, so it fails safe in every direction: renders fully
 * visible (matching its eventual settled state) until an effect proves
 * there's somewhere to reveal *from*, never hides content from JS-disabled
 * or slow-hydrating clients, and does nothing at all under
 * prefers-reduced-motion rather than skipping straight to visible with no
 * transition (which would still be a state change to detect and reason
 * about for no benefit).
 */
export function Reveal({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"visible" | "hidden" | "revealing">("visible");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const rect = el.getBoundingClientRect();
    // Already on screen at mount (above the fold, or a short page) - nothing
    // to reveal, leave it visible rather than hiding and instantly re-showing.
    if (rect.top < window.innerHeight) return;

    setState("hidden");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState("revealing");
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -80px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        state === "hidden" && "reveal-hidden",
        state === "revealing" && "reveal-visible",
        className,
      )}
    >
      {children}
    </div>
  );
}

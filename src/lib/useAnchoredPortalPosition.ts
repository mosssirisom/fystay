"use client";

import { useLayoutEffect, useState, type RefObject } from "react";

export type AnchoredPosition = { top: number; left: number; width: number };

/**
 * A trigger's position in DOCUMENT coordinates (not viewport), for popovers
 * that need to render via a portal instead of a plain CSS-absolute child.
 *
 * Why this exists: the homepage hero's search bar sits inside an absolutely-
 * positioned wrapper with its own z-index, but the hero <section> itself has
 * no z-index of its own (position:relative, z-index:auto). Per the CSS2.1
 * painting-order rules, a positioned box with z-index:auto paints as a single
 * unit alongside other z-index:0 content - its whole subtree, regardless of
 * whatever z-index values its own descendants use internally, still paints
 * *before* any sibling that has an explicit positive z-index (like the page
 * content section right below the hero, which needs z-50 for its own
 * reasons - see page.tsx). That makes any popover living inside the hero
 * (the date range picker, guest picker, destination autocomplete)
 * structurally unable to ever paint above that section, no matter how high
 * its own z-index goes - it's stuck one stacking-context level too deep.
 * Portaling the popover out to document.body sidesteps the trap entirely
 * instead of fighting it with an ever-higher z-index that can never win.
 *
 * Positioned absolute-in-document (not fixed), so it scrolls naturally with
 * the page and only needs recomputing on open and on resize, never on scroll.
 */
export function useAnchoredPortalPosition(
  triggerRef: RefObject<HTMLElement | null>,
  open: boolean,
): AnchoredPosition | null {
  const [position, setPosition] = useState<AnchoredPosition | null>(null);

  useLayoutEffect(() => {
    if (!open) return;

    function measure() {
      const el = triggerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [open, triggerRef]);

  return open ? position : null;
}

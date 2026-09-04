"use client";

import { useEffect } from "react";
import type { RefObject } from "react";

/**
 * Reserves real space at the true bottom of the whole document, sized to
 * match a fixed-position element's own rendered height - not just space
 * within whatever page happens to render it. A position:fixed bar always
 * sits over the bottom of the *viewport*, so padding added only inside a
 * page's own content stops it covering that page's own content but does
 * nothing once a guest scrolls past that content into the site-wide
 * Footer, which renders after every page with no reserved space of its
 * own - without this, a fixed bar permanently hides the Footer's last few
 * rows (its legal links) once scrolled that far.
 *
 * A ResizeObserver (rather than a fixed pixel value, or reading the
 * height once) means this self-corrects if the bar's own height ever
 * changes, including collapsing to 0 via a responsive lg:hidden once the
 * viewport crosses into desktop width.
 *
 * Also exposes that same height as the --fixed-bottom-bar-height CSS
 * variable (default 0px - see globals.css) so any other fixed-position UI
 * that must avoid this bar, e.g. a floating support button pinned to the
 * bottom corner, can read the same live number instead of hardcoding a
 * guess or duplicating this observer.
 */
export function useReserveBottomSpace(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      document.body.style.paddingBottom = `${el.offsetHeight}px`;
      document.documentElement.style.setProperty(
        "--fixed-bottom-bar-height",
        `${el.offsetHeight}px`,
      );
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      document.body.style.paddingBottom = "";
      document.documentElement.style.removeProperty("--fixed-bottom-bar-height");
    };
  }, [ref]);
}

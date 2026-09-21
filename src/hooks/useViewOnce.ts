"use client";

import { useEffect, useRef } from "react";

/**
 * Fires `onView` the first time the returned ref's element scrolls into
 * the viewport, then disconnects - built for "offer viewed" analytics
 * (see src/lib/analytics.ts), where what matters is a genuine impression,
 * not just that the component mounted somewhere off-screen below the fold.
 * Never fires twice for the same mount, so a guest scrolling past a
 * section repeatedly only counts once.
 */
export function useViewOnce<T extends HTMLElement>(onView: () => void, deps: unknown[] = []) {
  const ref = useRef<T | null>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || firedRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (firedRef.current) return;
        if (entries.some((entry) => entry.isIntersecting)) {
          firedRef.current = true;
          onView();
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(node);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}

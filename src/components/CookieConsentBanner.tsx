"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

const DISMISSED_KEY = "fystay:cookie-notice-dismissed";

function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(DISMISSED_KEY) === "true";
  } catch {
    // localStorage can be unavailable (private browsing, disabled storage)
    // - showing the notice every visit is the safe fallback.
    return false;
  }
}

export function CookieConsentBanner() {
  // Always starts hidden during the server render and the first client
  // render (before hydration), then this mount-only effect reveals it if
  // it hasn't already been dismissed. A lazy useState initializer would run
  // during render instead and could mismatch between server and client,
  // since whether localStorage has a "dismissed" flag can only be known
  // client-side, after mount.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing with an external system (localStorage) that's only readable post-mount, not derivable from props/state
    setVisible(!readDismissed());
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      window.localStorage.setItem(DISMISSED_KEY, "true");
    } catch {
      // Nothing to persist to - the notice will just show again next visit.
    }
  }

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie notice"
      className="border-b border-border-subtle bg-surface-muted px-6 py-3"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-600">
          We only use strictly necessary cookies to keep you signed in and run the site - no
          tracking or advertising cookies. See our{" "}
          <Link href="/legal/cookies" className="text-brand-700 underline-offset-2 hover:underline">
            Cookie Policy
          </Link>{" "}
          for details.
        </p>
        <Button onClick={dismiss} size="sm" className="shrink-0">
          Got it
        </Button>
      </div>
    </div>
  );
}

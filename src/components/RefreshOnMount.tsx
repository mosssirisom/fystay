"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Forces a re-fetch of every server component on this route, including the
 * root layout - used on the conversation page, whose render already marked
 * the other participant's messages as read (see /inbox/[id]/page.tsx). A
 * plain client-side navigation into this page (clicking a conversation from
 * the inbox list) doesn't by itself invalidate an already-rendered layout
 * segment, so without this the nav's unread-message dot would keep showing
 * stale count until the next unrelated hard navigation or reload.
 */
export function RefreshOnMount() {
  const router = useRouter();
  useEffect(() => {
    router.refresh();
    // Only ever once per mount - this page is what just changed the
    // server-side read state, not something that keeps changing on its own.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

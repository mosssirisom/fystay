"use client";

import { useEffect } from "react";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import * as Sentry from "@sentry/nextjs";
import { Button, buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

/**
 * Route-scoped error boundary for /hotels and /hotels/[destination]/
 * [hotelSlug] - without this, an unexpected (non-HotelProviderAdapterError)
 * bug in searchHotels()/getHotelForBooking()/getHotelAvailability() (see
 * those functions' own comments on why such errors are re-thrown rather
 * than swallowed) fell through to the generic root src/app/error.tsx, whose
 * copy and recovery links have nothing to do with hotel search. Same visual
 * treatment as the root boundary, but "Back to hotel search" replaces "Go
 * home" as the recovery path that actually makes sense here.
 */
export default function HotelsRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
        <TriangleAlert className="h-7 w-7" />
      </span>
      <h1 className="text-2xl font-bold text-foreground">Hotel search hit a snag</h1>
      <p className="mt-2 text-stone-500">
        Something went wrong loading hotel deals. You can try again, or start a new search.
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/hotels" className={cn(buttonVariants({ variant: "outline" }))}>
          Back to hotel search
        </Link>
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

// error.tsx (this directory) catches errors thrown while rendering a page -
// but not one thrown by the root layout itself, since that layout is what
// error.tsx's own fallback UI would need to render inside. This file is
// Next.js's dedicated catch for that one case: it replaces the entire
// document (its own <html>/<body>), so it only ever needs to fire when
// something above error.tsx's reach has broken.
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
          <p className="mt-2 text-stone-500">
            An unexpected error occurred. Please refresh the page.
          </p>
        </div>
      </body>
    </html>
  );
}

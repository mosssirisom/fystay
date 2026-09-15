"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Page numbers shown around the current one, e.g. for page 5 of 12 with
 * maxLength 7: 1 … 4 5 6 … 12. Keeps the control a fixed, scannable width
 * instead of growing unbounded on a large result set.
 */
function pageNumbersToShow(current: number, total: number, maxLength = 7): (number | "ellipsis")[] {
  if (total <= maxLength) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

  const result: (number | "ellipsis")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push("ellipsis");
    result.push(sorted[i]);
  }
  return result;
}

export function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  function hrefFor(target: number): string {
    const params = new URLSearchParams(searchParams.toString());
    if (target <= 1) params.delete("page");
    else params.set("page", String(target));
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  function goTo(target: number) {
    router.push(hrefFor(target), { scroll: true });
  }

  return (
    <nav aria-label="Search results pages" className="flex items-center justify-center gap-1 pt-4">
      <button
        type="button"
        onClick={() => goTo(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className="focus-ring flex h-9 w-9 items-center justify-center rounded-full text-stone-500 hover:bg-surface-muted disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
      </button>

      {pageNumbersToShow(page, totalPages).map((entry, i) =>
        entry === "ellipsis" ? (
          <span key={`ellipsis-${i}`} className="px-1 text-sm text-stone-400" aria-hidden>
            …
          </span>
        ) : (
          <button
            key={entry}
            type="button"
            onClick={() => goTo(entry)}
            aria-current={entry === page ? "page" : undefined}
            className={cn(
              "focus-ring flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium",
              entry === page
                ? "bg-brand-700 text-white"
                : "text-foreground hover:bg-surface-muted",
            )}
          >
            {entry}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => goTo(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
        className="focus-ring flex h-9 w-9 items-center justify-center rounded-full text-stone-500 hover:bg-surface-muted disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronRight className="h-4 w-4" aria-hidden />
      </button>
    </nav>
  );
}

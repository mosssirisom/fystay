import Link from "next/link";
import { CarFront, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

/**
 * A Trip Extra can only ever be added against an existing booking (see
 * src/app/api/bookings/[id]/extras/route.ts) - there's no standalone
 * "buy a transfer" flow a first-time visitor could land on. So this promo
 * points at browsing stays, not at a purchase this page can't actually
 * start, and is honest that the transfer itself is arranged once a stay is
 * booked, not from here.
 */
export async function AirportTransferPromo() {
  const offering = await prisma.extraOffering.findFirst({
    where: { category: "AIRPORT_TRANSFER", active: true, provider: { active: true } },
    include: { provider: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });

  // Nothing invented if this Trip Extra isn't configured/active right now -
  // the section simply doesn't render, the same "no checkbox with nothing
  // behind it" principle amenityCategories.ts already follows.
  if (!offering) return null;

  return (
    <div className="mt-14 overflow-hidden rounded-2xl bg-gradient-to-br from-ink via-brand-900 to-brand-700 shadow-[var(--shadow-popover)]">
      <div className="flex flex-col items-center gap-6 px-6 py-10 text-center sm:flex-row sm:justify-between sm:px-10 sm:text-left">
        <div className="flex items-start gap-4">
          <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-white sm:flex">
            <CarFront className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
              Add to any stay
            </p>
            <h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">
              Door-to-door airport transfers with {offering.provider.name}
            </h2>
            <p className="mt-1 max-w-md text-sm text-white/80">{offering.description}</p>
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-white/70">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-brand-300" aria-hidden />
                Fixed price
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-brand-300" aria-hidden />
                Booked with your stay
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-brand-300" aria-hidden />
                Confirmed by {offering.provider.name}
              </li>
            </ul>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-center gap-3 sm:items-end">
          <p className="text-sm text-white/70">
            From{" "}
            <span className="text-2xl font-bold text-white">{formatPrice(offering.priceCents)}</span>
          </p>
          <Link
            href="/search"
            className={cn(buttonVariants({ size: "lg" }), "bg-white text-brand-800 hover:bg-white/90")}
          >
            Browse stays
          </Link>
        </div>
      </div>
    </div>
  );
}

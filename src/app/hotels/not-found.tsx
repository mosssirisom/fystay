import Link from "next/link";
import { Building2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

/**
 * Overrides the root not-found.tsx for anything under /hotels/* - the
 * default copy talks about "the listing", which is FYStay's own vocabulary
 * for its directly-booked properties and reads oddly for a third-party
 * affiliate hotel that simply isn't cached/known under this slug.
 */
export default function HotelNotFound() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
        <Building2 className="h-7 w-7" />
      </span>
      <h1 className="text-2xl font-bold text-foreground">We can&apos;t find that hotel</h1>
      <p className="mt-2 text-stone-500">
        It may no longer be listed by our booking partner. Try searching again.
      </p>
      <Link href="/hotels" className={cn(buttonVariants(), "mt-6")}>
        Search hotels
      </Link>
    </div>
  );
}

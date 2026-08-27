import Link from "next/link";
import { Compass } from "lucide-react";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
        <Compass className="h-7 w-7" />
      </span>
      <h1 className="text-2xl font-bold text-foreground">We can&apos;t find that page</h1>
      <p className="mt-2 text-zinc-500">
        It might have been moved, or the listing may no longer be available.
      </p>
      <Link href="/" className={cn(buttonVariants(), "mt-6")}>
        Back to exploring
      </Link>
    </div>
  );
}

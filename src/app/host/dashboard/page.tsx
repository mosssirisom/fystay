import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PlusCircle } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { HostListingRow } from "@/components/HostListingRow";
import { Card } from "@/components/ui/Card";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Host dashboard", robots: { index: false } };

export default async function HostDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/host/dashboard");
  if (session.user.role !== "HOST") redirect("/");

  const listings = await prisma.listing.findMany({
    where: { hostId: session.user.id },
    include: {
      // Upcoming bookings plus recently cancelled ones, so a host can see
      // what got cancelled (and any refund) without them ever disappearing
      // from the dashboard the moment they're no longer active.
      bookings: {
        where: { status: { in: ["PENDING", "CONFIRMED", "CANCELLED", "REFUNDED"] } },
        include: { changeRequests: { orderBy: { createdAt: "desc" } } },
        orderBy: { checkIn: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Your listings</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {listings.length} listing{listings.length === 1 ? "" : "s"}
          </p>
        </div>
        <Link href="/host/listings/new" className={cn(buttonVariants())}>
          <PlusCircle className="h-4 w-4" />
          New listing
        </Link>
      </div>

      {listings.length === 0 ? (
        <Card className="mt-8 flex flex-col items-center gap-3 p-12 text-center">
          <PlusCircle className="h-8 w-8 text-zinc-300" />
          <p className="font-medium text-foreground">No listings yet</p>
          <p className="max-w-sm text-sm text-zinc-500">
            Create your first listing to start welcoming guests.
          </p>
          <Link href="/host/listings/new" className={cn(buttonVariants(), "mt-2")}>
            Create a listing
          </Link>
        </Card>
      ) : (
        <ul className="mt-6 flex flex-col gap-4">
          {listings.map((listing) => (
            <HostListingRow key={listing.id} listing={listing} />
          ))}
        </ul>
      )}
    </div>
  );
}

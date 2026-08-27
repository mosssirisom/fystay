import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { DeleteListingButton } from "@/components/DeleteListingButton";

export default async function HostDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/host/dashboard");
  if (session.user.role !== "HOST") redirect("/");

  const listings = await prisma.listing.findMany({
    where: { hostId: session.user.id },
    include: {
      bookings: {
        where: { status: { in: ["PENDING", "CONFIRMED"] } },
        orderBy: { checkIn: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your listings</h1>
        <Link
          href="/host/listings/new"
          className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
        >
          + New listing
        </Link>
      </div>

      {listings.length === 0 ? (
        <p className="mt-8 text-zinc-500">You haven&apos;t created any listings yet.</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-4">
          {listings.map((listing) => (
            <li key={listing.id} className="rounded-xl border border-zinc-200 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <Link
                    href={`/listings/${listing.id}`}
                    className="font-medium hover:text-rose-600"
                  >
                    {listing.title}
                  </Link>
                  <p className="text-sm text-zinc-500">
                    {listing.city}, {listing.country} · {formatPrice(listing.pricePerNightCents)}
                    /night
                  </p>
                  <p className="text-sm text-zinc-500">
                    {listing.published ? "Published" : "Unpublished"} · {listing.bookings.length}{" "}
                    upcoming booking{listing.bookings.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <Link
                    href={`/host/listings/${listing.id}/edit`}
                    className="text-sm font-medium text-zinc-700 hover:underline"
                  >
                    Edit
                  </Link>
                  <DeleteListingButton listingId={listing.id} />
                </div>
              </div>

              {listing.bookings.length > 0 && (
                <ul className="mt-3 flex flex-col gap-1 border-t border-zinc-100 pt-3 text-sm text-zinc-600">
                  {listing.bookings.map((booking) => (
                    <li key={booking.id}>
                      {booking.checkIn.toLocaleDateString()} –{" "}
                      {booking.checkOut.toLocaleDateString()} · {booking.guests} guest
                      {booking.guests > 1 ? "s" : ""} ·{" "}
                      <span className="font-medium">{booking.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

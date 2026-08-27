import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";

const statusStyles: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-zinc-100 text-zinc-600",
};

export default async function BookingsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/bookings");
  }

  const bookings = await prisma.booking.findMany({
    where: { guestId: session.user.id },
    include: { listing: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
      <h1 className="text-2xl font-bold">My trips</h1>

      {bookings.length === 0 ? (
        <p className="mt-8 text-zinc-500">
          You haven&apos;t booked any trips yet.{" "}
          <Link href="/" className="font-medium text-rose-600">
            Start exploring
          </Link>
          .
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-4">
          {bookings.map((booking) => (
            <li
              key={booking.id}
              className="flex items-center justify-between rounded-xl border border-zinc-200 p-4"
            >
              <div>
                <Link
                  href={`/listings/${booking.listingId}`}
                  className="font-medium hover:text-rose-600"
                >
                  {booking.listing.title}
                </Link>
                <p className="text-sm text-zinc-500">
                  {booking.listing.city}, {booking.listing.country}
                </p>
                <p className="text-sm text-zinc-500">
                  {booking.checkIn.toLocaleDateString()} – {booking.checkOut.toLocaleDateString()} ·{" "}
                  {booking.guests} guest{booking.guests > 1 ? "s" : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatPrice(booking.totalPriceCents)}</p>
                <span
                  className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[booking.status]}`}
                >
                  {booking.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

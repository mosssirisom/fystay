import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, BedDouble, CalendarCheck2, ShieldCheck, Gift } from "lucide-react";
import { auth } from "@/auth";
import { getUserDetailForAdmin } from "@/lib/adminUserLookup";
import { formatPrice } from "@/lib/format";
import { SectionHeading } from "@/components/SectionHeading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge, type BadgeProps } from "@/components/ui/Badge";

export const metadata: Metadata = { title: "User detail", robots: { index: false } };

const ROLE_VARIANT: Record<string, BadgeProps["variant"]> = {
  ADMIN: "brand",
  HOST: "success",
  GUEST: "neutral",
};

const BOOKING_STATUS_VARIANT: Record<string, BadgeProps["variant"]> = {
  PENDING: "warning",
  CONFIRMED: "success",
  CANCELLED: "neutral",
  COMPLETED: "brand",
  REFUNDED: "neutral",
};

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/**
 * "What's going on with this account" for support - see
 * getUserDetailForAdmin for exactly what's queried. Deliberately not a
 * full data export (that's a separate self-service feature) - just enough
 * to answer a support conversation.
 */
export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=/admin/users/${id}`);
  if (session.user.role !== "ADMIN") redirect("/");

  const user = await getUserDetailForAdmin(id);
  if (!user) notFound();

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
      <Link
        href="/admin/users"
        className="focus-ring inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-stone-500 hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to users
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{user.name}</h1>
          <p className="mt-1 text-stone-600">{user.email}</p>
        </div>
        <div className="flex gap-2">
          <Badge variant={ROLE_VARIANT[user.role] ?? "neutral"}>{user.role}</Badge>
          {user.deletedAt && <Badge variant="neutral">Deleted account</Badge>}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <SectionHeading icon={ShieldCheck}>Account & security</SectionHeading>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-stone-700">
              <p>
                <span className="text-stone-500">Joined:</span> {dateFormatter.format(user.createdAt)}
              </p>
              <p>
                <span className="text-stone-500">2FA enabled:</span>{" "}
                {user.twoFactorEnabledAt ? `Yes (${dateFormatter.format(user.twoFactorEnabledAt)})` : "No"}
              </p>
              <p>
                <span className="text-stone-500">Phone verified:</span>{" "}
                {user.phoneVerifiedAt ? `Yes - ${user.phone}` : "No"}
              </p>
              <p>
                <span className="text-stone-500">ID verification:</span>{" "}
                {user.identityVerificationStatus}
              </p>
              {user.role === "HOST" && (
                <>
                  <p>
                    <span className="text-stone-500">Stripe Connect:</span>{" "}
                    {user.stripeConnectAccountId ? "Connected" : "Not connected"}
                  </p>
                  <p>
                    <span className="text-stone-500">Payouts enabled:</span>{" "}
                    {user.stripeConnectPayoutsEnabled ? "Yes" : "No"}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <SectionHeading icon={CalendarCheck2}>Bookings as guest</SectionHeading>
            </CardHeader>
            <CardContent className="p-0">
              {user.bookings.length === 0 ? (
                <p className="p-5 text-sm text-stone-500">No bookings yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-border-subtle text-xs font-medium uppercase tracking-wide text-stone-500">
                        <th className="px-4 py-3">Reference</th>
                        <th className="px-4 py-3">Listing</th>
                        <th className="px-4 py-3">Check-in</th>
                        <th className="px-4 py-3">Total</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {user.bookings.map((booking) => (
                        <tr key={booking.id} className="border-b border-border-subtle last:border-0">
                          <td className="px-4 py-3">
                            <Link
                              href={`/admin/bookings/${booking.id}`}
                              className="font-mono text-xs font-medium text-brand-700 hover:underline"
                            >
                              {booking.reference}
                            </Link>
                          </td>
                          <td className="max-w-[180px] truncate px-4 py-3 text-stone-700">
                            {booking.listing.title}
                          </td>
                          <td className="px-4 py-3 text-stone-700">
                            {dateFormatter.format(booking.checkIn)}
                          </td>
                          <td className="px-4 py-3 tabular-nums text-stone-700">
                            {formatPrice(booking.totalPriceCents)}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={BOOKING_STATUS_VARIANT[booking.status] ?? "neutral"}>
                              {booking.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {user.role === "HOST" && (
            <Card>
              <CardHeader>
                <SectionHeading icon={BedDouble}>Listings as host</SectionHeading>
              </CardHeader>
              <CardContent className="p-0">
                {user.listings.length === 0 ? (
                  <p className="p-5 text-sm text-stone-500">No listings yet.</p>
                ) : (
                  <div className="flex flex-col divide-y divide-border-subtle">
                    {user.listings.map((listing) => (
                      <div
                        key={listing.id}
                        className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                      >
                        <div>
                          <p className="text-stone-700">{listing.title}</p>
                          <p className="text-xs text-stone-500">{listing.city}</p>
                        </div>
                        {!listing.published && <Badge variant="neutral">Unpublished</Badge>}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <SectionHeading icon={Gift}>Referrals</SectionHeading>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm text-stone-700">
              <p>
                <span className="text-stone-500">Referral code:</span> {user.referralCode}
              </p>
              <p>
                <span className="text-stone-500">Credit balance:</span>{" "}
                {formatPrice(user.creditBalanceCents)}
              </p>
              <p>
                <span className="text-stone-500">Referred by:</span>{" "}
                {user.referredBy ? `${user.referredBy.name} (${user.referredBy.email})` : "—"}
              </p>
              <p>
                <span className="text-stone-500">People referred:</span> {user._count.referrals}
              </p>
              <p>
                <span className="text-stone-500">Referral bonus awarded:</span>{" "}
                {user.referralBonusAwarded ? "Yes" : "No"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Totals</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1 text-sm text-stone-700">
              <p>
                <span className="text-stone-500">Bookings as guest:</span> {user._count.bookings}
              </p>
              <p>
                <span className="text-stone-500">Listings as host:</span> {user._count.listings}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

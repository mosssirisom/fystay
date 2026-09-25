import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  BadgeCheck,
  Calculator,
  Eye,
  MousePointerClick,
  Percent,
  PoundSterling,
  Search,
} from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  groupRevenueByDate,
  groupRevenueByKey,
  summarizeAffiliateFunnel,
  summarizeConversionRevenue,
} from "@/lib/hotelAffiliateSummary";
import { formatPrice } from "@/lib/format";
import { AdminNav } from "@/components/admin/AdminNav";
import { StatCard } from "@/components/host/StatCard";
import { SectionHeading } from "@/components/SectionHeading";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge, type BadgeProps } from "@/components/ui/Badge";

export const metadata: Metadata = { title: "Hotel affiliate analytics", robots: { index: false } };

const HOTEL_DETAIL_VIEWED_EVENT = "hotel_detail_viewed";

const CONVERSION_STATUS_VARIANT: Record<string, BadgeProps["variant"]> = {
  PENDING: "warning",
  CONFIRMED: "success",
  CANCELLED: "neutral",
};

function RevenueTable({
  title,
  columnLabel,
  rows,
}: {
  title: string;
  columnLabel: string;
  rows: { key: string; confirmedCommissionCents: number; estimatedCommissionCents: number; conversionCount: number }[];
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-stone-500">
          No conversions recorded yet - this fills in once a provider reports one back.
        </p>
      ) : (
        <Card className="mt-2">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border-subtle text-xs font-medium uppercase tracking-wide text-stone-500">
                    <th className="px-4 py-2.5">{columnLabel}</th>
                    <th className="px-4 py-2.5">Confirmed</th>
                    <th className="px-4 py-2.5">Estimated</th>
                    <th className="px-4 py-2.5">Conversions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.key} className="border-b border-border-subtle last:border-0">
                      <td className="px-4 py-2.5 text-stone-700">{row.key}</td>
                      <td className="px-4 py-2.5 tabular-nums text-stone-700">
                        {formatPrice(row.confirmedCommissionCents)}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-stone-500">
                        {formatPrice(row.estimatedCommissionCents)}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-stone-700">{row.conversionCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * The hotel-affiliate equivalent of the platform /admin overview - what the
 * affiliate marketplace (Phases 5-7) is actually doing, built entirely on
 * top of the schema those phases already wrote to (AffiliateSearch/
 * AffiliateClick/AffiliateConversion) plus the hotel_detail_viewed
 * AnalyticsEvent this phase adds. Every number here is a live read off
 * those real tables - there is no separate metrics pipeline, and no number
 * on this page is ever invented: a conversion or a commission shows up here
 * only because reconcileConversion() (conversion.ts) was actually called
 * with a real provider report, which nothing in this codebase does yet
 * (mock provider only) - so the conversion/commission sections are
 * expected to read as empty today, honestly, rather than faked.
 */
export default async function HotelAffiliateAnalyticsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin/hotel-affiliate");
  if (session.user.role !== "ADMIN") redirect("/");

  const [totalSearches, totalDetailViews, totalClicks, conversions, recentClicks, recentSearches] =
    await Promise.all([
      prisma.affiliateSearch.count(),
      prisma.analyticsEvent.count({ where: { name: HOTEL_DETAIL_VIEWED_EVENT } }),
      prisma.affiliateClick.count(),
      prisma.affiliateConversion.findMany({
        include: { click: { include: { provider: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.affiliateClick.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { provider: true, hotel: { select: { name: true } } },
      }),
      prisma.affiliateSearch.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { provider: true },
      }),
    ]);

  const funnel = summarizeAffiliateFunnel({ totalSearches, totalDetailViews, totalClicks });
  const revenue = summarizeConversionRevenue(conversions);

  function conversionRow(c: (typeof conversions)[number]) {
    return {
      status: c.status,
      commissionCents: c.commissionCents,
      commissionConfirmed: c.commissionConfirmed,
    };
  }
  const byProvider = groupRevenueByKey(
    conversions.map((c) => ({ ...conversionRow(c), key: c.click.provider.name })),
  );
  const byDestination = groupRevenueByKey(
    conversions.map((c) => ({ ...conversionRow(c), key: c.click.destination ?? "Unknown" })),
  );
  const byDate = groupRevenueByDate(
    conversions.map((c) => ({ ...conversionRow(c), date: c.reportedAt ?? c.createdAt })),
  );

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
      <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Hotel affiliate analytics</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
        Search-to-click funnel and commission reporting for the hotel affiliate marketplace - built
        against the mock provider only today, so every figure below reflects test traffic, not real
        bookings.
      </p>

      <div className="mt-6">
        <AdminNav active="/admin/hotel-affiliate" />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Search} label="Total searches" value={funnel.totalSearches.toLocaleString()} />
        <StatCard icon={Eye} label="Hotel detail views" value={funnel.totalDetailViews.toLocaleString()} />
        <StatCard
          icon={MousePointerClick}
          label="Affiliate clicks"
          value={funnel.totalClicks.toLocaleString()}
        />
        <StatCard
          icon={Percent}
          label="Click-through rate"
          value={`${(funnel.clickThroughRate * 100).toFixed(1)}%`}
          sublabel="Clicks ÷ searches"
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          icon={BadgeCheck}
          label="Confirmed bookings"
          value={revenue.confirmedBookingsCount.toLocaleString()}
          sublabel={`${revenue.pendingCount} pending · ${revenue.cancelledCount} cancelled`}
        />
        <StatCard
          icon={PoundSterling}
          label="Confirmed commission"
          value={formatPrice(revenue.confirmedCommissionCents)}
          sublabel="Finalized by the provider"
        />
        <StatCard
          icon={Calculator}
          label="Estimated commission"
          value={formatPrice(revenue.estimatedCommissionCents)}
          sublabel="Not yet finalized"
        />
      </div>

      <div className="mt-8 flex flex-col gap-6">
        <SectionHeading icon={PoundSterling}>Revenue</SectionHeading>
        <RevenueTable title="By provider" columnLabel="Provider" rows={byProvider} />
        <RevenueTable title="By destination" columnLabel="Destination" rows={byDestination} />
        <RevenueTable title="By date" columnLabel="Date" rows={byDate} />
      </div>

      <div className="mt-8">
        <SectionHeading icon={MousePointerClick}>Recent affiliate clicks</SectionHeading>
        {recentClicks.length === 0 ? (
          <p className="mt-3 text-sm text-stone-500">No clicks recorded yet.</p>
        ) : (
          <Card className="mt-3">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle text-xs font-medium uppercase tracking-wide text-stone-500">
                      <th className="px-4 py-3">Hotel</th>
                      <th className="px-4 py-3">Provider</th>
                      <th className="px-4 py-3">Destination</th>
                      <th className="px-4 py-3">Stay</th>
                      <th className="px-4 py-3">Sub-ID</th>
                      <th className="px-4 py-3">Clicked</th>
                      <th className="px-4 py-3">Conversion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentClicks.map((click) => {
                      const conversion = conversions.find((c) => c.clickId === click.id);
                      return (
                        <tr key={click.id} className="border-b border-border-subtle last:border-0">
                          <td className="max-w-[180px] truncate px-4 py-3 text-stone-700">
                            {click.hotel.name}
                          </td>
                          <td className="px-4 py-3 text-stone-700">{click.provider.name}</td>
                          <td className="px-4 py-3 text-stone-700">{click.destination ?? "—"}</td>
                          <td className="px-4 py-3 text-stone-700">
                            {click.checkIn && click.checkOut
                              ? `${click.checkIn.toLocaleDateString()} – ${click.checkOut.toLocaleDateString()}`
                              : "—"}
                          </td>
                          <td className="max-w-[140px] truncate px-4 py-3 font-mono text-xs text-stone-500">
                            {click.subId}
                          </td>
                          <td className="px-4 py-3 text-stone-700">{click.createdAt.toLocaleString()}</td>
                          <td className="px-4 py-3">
                            {conversion ? (
                              <Badge variant={CONVERSION_STATUS_VARIANT[conversion.status] ?? "neutral"}>
                                {conversion.status}
                              </Badge>
                            ) : (
                              <span className="text-xs text-stone-400">No conversion yet</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="mt-8">
        <SectionHeading icon={Search}>Recent searches</SectionHeading>
        {recentSearches.length === 0 ? (
          <p className="mt-3 text-sm text-stone-500">No searches recorded yet.</p>
        ) : (
          <Card className="mt-3">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle text-xs font-medium uppercase tracking-wide text-stone-500">
                      <th className="px-4 py-3">Destination</th>
                      <th className="px-4 py-3">Provider</th>
                      <th className="px-4 py-3">Stay</th>
                      <th className="px-4 py-3">Guests</th>
                      <th className="px-4 py-3">Results</th>
                      <th className="px-4 py-3">Searched</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSearches.map((search) => (
                      <tr key={search.id} className="border-b border-border-subtle last:border-0">
                        <td className="px-4 py-3 text-stone-700">{search.destination}</td>
                        <td className="px-4 py-3 text-stone-700">{search.provider?.name ?? "—"}</td>
                        <td className="px-4 py-3 text-stone-700">
                          {search.checkIn.toLocaleDateString()} – {search.checkOut.toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-stone-700">
                          {search.adults + search.children} guest{search.adults + search.children === 1 ? "" : "s"},{" "}
                          {search.rooms} room{search.rooms === 1 ? "" : "s"}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-stone-700">
                          {search.resultCount ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-stone-700">{search.createdAt.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

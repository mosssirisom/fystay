import { prisma } from "@/lib/prisma";
import type { AffiliateConversionStatus } from "@prisma/client";

export type ConversionReport = {
  /** The AffiliateClick.subId this report is about - the only thing a real provider's reporting feed ever identifies a booking by, from FYStay's side (see click.ts's own comment on why it's built deterministically from server-only data in the first place). */
  subId: string;
  status: AffiliateConversionStatus;
  externalBookingReference?: string | null;
  bookingValueCents?: number | null;
  currency?: string | null;
  /**
   * FYStay's best-known commission figure for this booking - see
   * AffiliateConversion's own schema comment. Optional/null is a real,
   * expected value (e.g. a PENDING report with no commission estimate
   * yet), not an error.
   */
  commissionCents?: number | null;
  /** Whether commissionCents came from the provider's own finalized report (true) or is only an estimate (false) - see this model's own schema comment. Required, not defaulted: every caller has to make this call explicitly rather than a silent guess landing on "confirmed". */
  commissionConfirmed: boolean;
  reportedAt?: Date | null;
  rawData?: unknown;
};

export type ReconcileConversionOutcome =
  | { status: "ok"; conversionId: string; clickId: string }
  | { status: "unknown_click" };

/**
 * The one place a real provider's conversion/reporting feed - Booking.com's
 * eventual one, or any future provider's - is ever turned into an
 * AffiliateConversion row, reconciled purely by the subId this app itself
 * generated and embedded in that click's deep link (see
 * src/lib/hotelProviders/click.ts). No live provider reporting integration
 * exists yet (mock provider only, Phase 8) - this function is the seam
 * that integration calls into once it does, rather than inventing its own
 * ad-hoc write path with its own reconciliation logic. Nothing in this
 * codebase calls this with invented data: an AffiliateConversion row only
 * ever exists because some caller of this function claims a provider
 * actually reported one (see this model's own schema comment in
 * prisma/schema.prisma on why that's the whole point of it existing as its
 * own table, separate from AffiliateClick).
 *
 * A click that doesn't exist under the reported subId is reported back as
 * "unknown_click" rather than silently creating an orphaned conversion or
 * throwing - a real provider's feed reporting on a subId this app never
 * issued (a stale/replayed report, a provider-side bug, or a sub-id format
 * FYStay retired) is exactly the case a caller needs to be able to tell
 * apart from a normal successful reconciliation.
 *
 * Idempotent by construction: AffiliateConversion.clickId is unique, so
 * re-reporting the same booking (a provider's feed re-sending an update, a
 * status moving PENDING -> CONFIRMED, a commission estimate later replaced
 * by a finalized figure) updates the same row rather than creating a
 * second one.
 */
export async function reconcileConversion(report: ConversionReport): Promise<ReconcileConversionOutcome> {
  const click = await prisma.affiliateClick.findUnique({
    where: { subId: report.subId },
    select: { id: true },
  });
  if (!click) return { status: "unknown_click" };

  const fields = {
    status: report.status,
    externalBookingReference: report.externalBookingReference ?? null,
    bookingValueCents: report.bookingValueCents ?? null,
    currency: report.currency ?? null,
    commissionCents: report.commissionCents ?? null,
    commissionConfirmed: report.commissionConfirmed,
    reportedAt: report.reportedAt ?? new Date(),
    rawData: (report.rawData ?? undefined) as never,
  };

  const conversion = await prisma.affiliateConversion.upsert({
    where: { clickId: click.id },
    create: { clickId: click.id, ...fields },
    update: fields,
  });

  return { status: "ok", conversionId: conversion.id, clickId: click.id };
}

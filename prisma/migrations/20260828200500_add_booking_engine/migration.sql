-- Extend BookingStatus with lifecycle states the app can now reach:
-- COMPLETED (stay finished, set lazily once checkout has passed) and
-- REFUNDED (a cancellation that actually returned money, as opposed to
-- CANCELLED for one that didn't).
ALTER TYPE "BookingStatus" ADD VALUE 'COMPLETED';
ALTER TYPE "BookingStatus" ADD VALUE 'REFUNDED';

-- Tracked separately from BookingStatus: a booking can be CONFIRMED while
-- still UNPAID isn't possible today, but keeping payment state on its own
-- axis (rather than overloading BookingStatus) is what lets a future partial
-- refund, a comped stay, etc. be represented without new booking statuses.
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PAID', 'REFUNDED');

-- A flat, once-per-stay fee a host can set. Existing listings default to 0
-- (no fee), so nothing changes for them until a host opts in.
ALTER TABLE "Listing" ADD COLUMN "cleaningFeeCents" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Booking"
  ADD COLUMN "reference" TEXT,
  ADD COLUMN "nights" INTEGER,
  ADD COLUMN "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
  ADD COLUMN "nightlyPriceCents" INTEGER,
  ADD COLUMN "cleaningFeeCents" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "serviceFeeCents" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "taxCents" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "guestName" TEXT,
  ADD COLUMN "guestEmail" TEXT,
  ADD COLUMN "guestPhone" TEXT,
  ADD COLUMN "paidAt" TIMESTAMP(3),
  ADD COLUMN "refundedAt" TIMESTAMP(3);

-- Backfill for rows that predate the price-breakdown columns: nights and a
-- best-effort nightly rate derived from what was actually charged (these
-- bookings genuinely had no cleaning/service/tax line items at the time).
UPDATE "Booking" SET "nights" = GREATEST(1, ("checkOut"::date - "checkIn"::date));
UPDATE "Booking" SET "nightlyPriceCents" = GREATEST(1, "totalPriceCents" / GREATEST("nights", 1));

-- Backfill a unique reference for pre-existing rows. Every booking created
-- from here on gets a proper short human-friendly code from application
-- code (src/lib/bookingReference.ts); this only satisfies the new
-- NOT NULL/UNIQUE constraint for rows that predate it.
UPDATE "Booking" SET "reference" = 'FY-LEGACY-' || upper(id) WHERE "reference" IS NULL;

-- Backfill payment state for bookings already processed under the old
-- single-status model, so the new column reflects reality immediately.
UPDATE "Booking" SET "paymentStatus" = 'PAID', "paidAt" = "updatedAt" WHERE "status" = 'CONFIRMED';
UPDATE "Booking" SET "paymentStatus" = 'REFUNDED', "refundedAt" = "updatedAt" WHERE "status" = 'CANCELLED' AND "stripePaymentIntentId" IS NOT NULL;

ALTER TABLE "Booking"
  ALTER COLUMN "reference" SET NOT NULL,
  ALTER COLUMN "nights" SET NOT NULL,
  ALTER COLUMN "nightlyPriceCents" SET NOT NULL;

CREATE UNIQUE INDEX "Booking_reference_key" ON "Booking"("reference");

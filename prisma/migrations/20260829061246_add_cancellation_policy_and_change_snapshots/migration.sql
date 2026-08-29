/*
  Warnings:

  - Added the required column `originalCheckIn` to the `BookingChangeRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originalCheckOut` to the `BookingChangeRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originalGuests` to the `BookingChangeRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originalTotalPriceCents` to the `BookingChangeRequest` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CancellationPolicyKind" AS ENUM ('FLEXIBLE', 'MODERATE', 'STRICT', 'CUSTOM');

-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'PARTIALLY_REFUNDED';

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "refundedAmountCents" INTEGER;

-- AlterTable
-- Added nullable first, then backfilled from each request's own booking (the
-- best available approximation for pre-existing rows, since the booking may
-- have already moved past this request's dates by now), then locked to
-- NOT NULL. New rows always populate these directly at creation time.
ALTER TABLE "BookingChangeRequest" ADD COLUMN     "originalCheckIn" TIMESTAMP(3),
ADD COLUMN     "originalCheckOut" TIMESTAMP(3),
ADD COLUMN     "originalGuests" INTEGER,
ADD COLUMN     "originalTotalPriceCents" INTEGER;

UPDATE "BookingChangeRequest" cr
SET "originalCheckIn" = b."checkIn",
    "originalCheckOut" = b."checkOut",
    "originalGuests" = b."guests",
    "originalTotalPriceCents" = b."totalPriceCents" - cr."priceDeltaCents"
FROM "Booking" b
WHERE b."id" = cr."bookingId";

ALTER TABLE "BookingChangeRequest"
ALTER COLUMN "originalCheckIn" SET NOT NULL,
ALTER COLUMN "originalCheckOut" SET NOT NULL,
ALTER COLUMN "originalGuests" SET NOT NULL,
ALTER COLUMN "originalTotalPriceCents" SET NOT NULL;

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "cancellationPolicy" "CancellationPolicyKind" NOT NULL DEFAULT 'MODERATE',
ADD COLUMN     "customCancellationCutoffDays" INTEGER,
ADD COLUMN     "customCancellationRefundPercent" INTEGER;

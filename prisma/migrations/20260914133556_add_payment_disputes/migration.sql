-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('WARNING_NEEDS_RESPONSE', 'WARNING_UNDER_REVIEW', 'WARNING_CLOSED', 'NEEDS_RESPONSE', 'UNDER_REVIEW', 'WON', 'LOST', 'PREVENTED');

-- CreateTable
CREATE TABLE "PaymentDispute" (
    "id" TEXT NOT NULL,
    "stripeDisputeId" TEXT NOT NULL,
    "stripeChargeId" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT,
    "amountCents" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "DisputeStatus" NOT NULL,
    "evidenceDueBy" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bookingId" TEXT,
    "bookingExtraId" TEXT,

    CONSTRAINT "PaymentDispute_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentDispute_stripeDisputeId_key" ON "PaymentDispute"("stripeDisputeId");

-- CreateIndex
CREATE INDEX "PaymentDispute_bookingId_idx" ON "PaymentDispute"("bookingId");

-- CreateIndex
CREATE INDEX "PaymentDispute_bookingExtraId_idx" ON "PaymentDispute"("bookingExtraId");

-- CreateIndex
CREATE INDEX "PaymentDispute_status_idx" ON "PaymentDispute"("status");

-- AddForeignKey
ALTER TABLE "PaymentDispute" ADD CONSTRAINT "PaymentDispute_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentDispute" ADD CONSTRAINT "PaymentDispute_bookingExtraId_fkey" FOREIGN KEY ("bookingExtraId") REFERENCES "BookingExtra"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "ChangeRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED');

-- CreateTable
CREATE TABLE "BookingChangeRequest" (
    "id" TEXT NOT NULL,
    "status" "ChangeRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestedCheckIn" TIMESTAMP(3) NOT NULL,
    "requestedCheckOut" TIMESTAMP(3) NOT NULL,
    "requestedGuests" INTEGER NOT NULL,
    "priceDeltaCents" INTEGER NOT NULL,
    "stripeSessionId" TEXT,
    "paidAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bookingId" TEXT NOT NULL,

    CONSTRAINT "BookingChangeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BookingChangeRequest_stripeSessionId_key" ON "BookingChangeRequest"("stripeSessionId");

-- CreateIndex
CREATE INDEX "BookingChangeRequest_bookingId_idx" ON "BookingChangeRequest"("bookingId");

-- AddForeignKey
ALTER TABLE "BookingChangeRequest" ADD CONSTRAINT "BookingChangeRequest_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

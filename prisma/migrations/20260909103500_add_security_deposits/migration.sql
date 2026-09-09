-- CreateEnum
CREATE TYPE "DepositStatus" AS ENUM ('NOT_REQUIRED', 'AWAITING_AUTHORIZATION', 'AUTHORIZED', 'CAPTURED', 'RELEASED');

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN "securityDepositCents" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "securityDepositCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "depositStatus" "DepositStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
ADD COLUMN "stripeDepositSessionId" TEXT,
ADD COLUMN "stripeDepositPaymentIntentId" TEXT,
ADD COLUMN "depositAuthorizedAt" TIMESTAMP(3),
ADD COLUMN "depositCapturedCents" INTEGER,
ADD COLUMN "depositCapturedAt" TIMESTAMP(3),
ADD COLUMN "depositReleasedAt" TIMESTAMP(3),
ADD COLUMN "depositClaimDeadline" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Booking_stripeDepositSessionId_key" ON "Booking"("stripeDepositSessionId");

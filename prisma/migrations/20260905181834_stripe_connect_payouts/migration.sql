-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "applicationFeeCents" INTEGER,
ADD COLUMN     "hostPaidViaConnect" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "BookingChangeRequest" ADD COLUMN     "applicationFeeCents" INTEGER,
ADD COLUMN     "hostPaidViaConnect" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "stripeConnectAccountId" TEXT,
ADD COLUMN     "stripeConnectChargesEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stripeConnectDetailsSubmitted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stripeConnectPayoutsEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeConnectAccountId_key" ON "User"("stripeConnectAccountId");


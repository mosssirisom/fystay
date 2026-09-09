-- AlterTable: User
-- referralCode is added nullable first and backfilled below, for the same
-- reason as icalExportToken in an earlier migration - a required unique
-- column can't be added directly to a table with existing rows.
ALTER TABLE "User" ADD COLUMN     "referralCode" TEXT,
ADD COLUMN     "referredByUserId" TEXT,
ADD COLUMN     "creditBalanceCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "referralBonusAwarded" BOOLEAN NOT NULL DEFAULT false;

UPDATE "User" SET "referralCode" = upper(substring(md5(random()::text || clock_timestamp()::text || "id"), 1, 8))
WHERE "referralCode" IS NULL;

ALTER TABLE "User" ALTER COLUMN "referralCode" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- CreateIndex
CREATE INDEX "User_referredByUserId_idx" ON "User"("referredByUserId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_referredByUserId_fkey" FOREIGN KEY ("referredByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: Booking
ALTER TABLE "Booking" ADD COLUMN     "creditAppliedCents" INTEGER NOT NULL DEFAULT 0;

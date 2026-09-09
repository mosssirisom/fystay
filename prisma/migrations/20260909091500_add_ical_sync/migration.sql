-- CreateEnum
CREATE TYPE "AvailabilityBlockSource" AS ENUM ('HOST', 'ICAL_IMPORT');

-- AlterTable: AvailabilityBlock
ALTER TABLE "AvailabilityBlock" ADD COLUMN     "source" "AvailabilityBlockSource" NOT NULL DEFAULT 'HOST',
ADD COLUMN     "externalUid" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "AvailabilityBlock_listingId_externalUid_key" ON "AvailabilityBlock"("listingId", "externalUid");

-- AlterTable: Listing
-- icalExportToken is added nullable first and backfilled below, since a
-- required unique column can't be added directly to a table with existing
-- rows - there's no single static default that would keep every row
-- unique. The backfill uses a portable md5 hash rather than
-- gen_random_uuid() so this doesn't depend on any Postgres extension.
ALTER TABLE "Listing" ADD COLUMN     "icalExportToken" TEXT,
ADD COLUMN     "icalImportUrl" TEXT,
ADD COLUMN     "icalSyncedAt" TIMESTAMP(3);

UPDATE "Listing" SET "icalExportToken" = md5(random()::text || clock_timestamp()::text || "id")
WHERE "icalExportToken" IS NULL;

ALTER TABLE "Listing" ALTER COLUMN "icalExportToken" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Listing_icalExportToken_key" ON "Listing"("icalExportToken");

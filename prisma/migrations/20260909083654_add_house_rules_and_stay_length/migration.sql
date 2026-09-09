-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "additionalRules" TEXT,
ADD COLUMN     "checkInInstructions" TEXT,
ADD COLUMN     "checkInTime" TEXT,
ADD COLUMN     "checkOutTime" TEXT,
ADD COLUMN     "maxNights" INTEGER,
ADD COLUMN     "minNights" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "partiesAllowed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "quietHoursEnd" TEXT,
ADD COLUMN     "quietHoursStart" TEXT,
ADD COLUMN     "selfCheckIn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "smokingAllowed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "wifiNetwork" TEXT,
ADD COLUMN     "wifiPassword" TEXT;

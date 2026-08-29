-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PUBLISHED', 'REMOVED');

-- CreateEnum
CREATE TYPE "ReviewReportStatus" AS ENUM ('OPEN', 'DISMISSED', 'ACTIONED');

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "accuracyRating" INTEGER,
ADD COLUMN     "cleanlinessRating" INTEGER,
ADD COLUMN     "communicationRating" INTEGER,
ADD COLUMN     "hostRespondedAt" TIMESTAMP(3),
ADD COLUMN     "hostResponse" TEXT,
ADD COLUMN     "locationRating" INTEGER,
ADD COLUMN     "status" "ReviewStatus" NOT NULL DEFAULT 'PUBLISHED',
ADD COLUMN     "valueRating" INTEGER;

-- CreateTable
CREATE TABLE "ReviewReport" (
    "id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" "ReviewReportStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,

    CONSTRAINT "ReviewReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReviewReport_reviewId_idx" ON "ReviewReport"("reviewId");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewReport_reviewId_reporterId_key" ON "ReviewReport"("reviewId", "reporterId");

-- AddForeignKey
ALTER TABLE "ReviewReport" ADD CONSTRAINT "ReviewReport_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewReport" ADD CONSTRAINT "ReviewReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

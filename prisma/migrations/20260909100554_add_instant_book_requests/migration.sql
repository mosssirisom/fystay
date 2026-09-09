-- CreateEnum
CREATE TYPE "BookingApprovalStatus" AS ENUM ('NONE', 'AWAITING', 'APPROVED', 'DECLINED', 'EXPIRED');

-- DropIndex
DROP INDEX "User_referredByUserId_idx";

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "approvalStatus" "BookingApprovalStatus" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "hostRespondedAt" TIMESTAMP(3),
ADD COLUMN     "requestExpiresAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "instantBook" BOOLEAN NOT NULL DEFAULT true;

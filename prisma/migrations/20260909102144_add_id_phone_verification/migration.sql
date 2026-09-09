-- CreateEnum
CREATE TYPE "IdentityVerificationStatus" AS ENUM ('NONE', 'PENDING', 'VERIFIED', 'FAILED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "phone" TEXT,
ADD COLUMN "phoneVerifiedAt" TIMESTAMP(3),
ADD COLUMN "identityVerificationStatus" "IdentityVerificationStatus" NOT NULL DEFAULT 'NONE',
ADD COLUMN "stripeIdentitySessionId" TEXT,
ADD COLUMN "identityVerifiedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeIdentitySessionId_key" ON "User"("stripeIdentitySessionId");

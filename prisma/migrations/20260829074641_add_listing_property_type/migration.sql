-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('APARTMENT', 'HOUSE', 'COTTAGE', 'VILLA', 'STUDIO', 'OTHER');

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "propertyType" "PropertyType" NOT NULL DEFAULT 'OTHER';

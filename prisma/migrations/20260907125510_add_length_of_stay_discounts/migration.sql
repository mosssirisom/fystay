-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "lengthOfStayDiscountCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lengthOfStayDiscountLabel" TEXT;

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "monthlyDiscountPercent" INTEGER,
ADD COLUMN     "weeklyDiscountPercent" INTEGER;

-- CreateEnum
CREATE TYPE "ExtraCategory" AS ENUM ('AIRPORT_TRANSFER', 'ATTRACTION_TICKET', 'CAR_HIRE');

-- CreateEnum
CREATE TYPE "BookingExtraStatus" AS ENUM ('PENDING_PAYMENT', 'PAID', 'CANCELLED', 'REFUNDED');

-- CreateTable
CREATE TABLE "ExtraProvider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ExtraCategory" NOT NULL,
    "notificationEmail" TEXT NOT NULL,
    "bookingFormUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExtraProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtraOffering" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "ExtraCategory" NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "providerId" TEXT NOT NULL,

    CONSTRAINT "ExtraOffering_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingExtra" (
    "id" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "status" "BookingExtraStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "stripeSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "paidAt" TIMESTAMP(3),
    "guestNotes" TEXT,
    "sentToProviderAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bookingId" TEXT NOT NULL,
    "offeringId" TEXT NOT NULL,

    CONSTRAINT "BookingExtra_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExtraProvider_name_key" ON "ExtraProvider"("name");

-- CreateIndex
CREATE INDEX "ExtraOffering_providerId_idx" ON "ExtraOffering"("providerId");

-- CreateIndex
CREATE UNIQUE INDEX "ExtraOffering_providerId_name_key" ON "ExtraOffering"("providerId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "BookingExtra_stripeSessionId_key" ON "BookingExtra"("stripeSessionId");

-- CreateIndex
CREATE INDEX "BookingExtra_bookingId_idx" ON "BookingExtra"("bookingId");

-- CreateIndex
CREATE INDEX "BookingExtra_offeringId_idx" ON "BookingExtra"("offeringId");

-- AddForeignKey
ALTER TABLE "ExtraOffering" ADD CONSTRAINT "ExtraOffering_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ExtraProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingExtra" ADD CONSTRAINT "BookingExtra_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingExtra" ADD CONSTRAINT "BookingExtra_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "ExtraOffering"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "HotelProviderStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'COMING_SOON');

-- CreateEnum
CREATE TYPE "AffiliateConversionStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- CreateTable
CREATE TABLE "HotelProvider" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "HotelProviderStatus" NOT NULL DEFAULT 'INACTIVE',
    "supportsSearch" BOOLEAN NOT NULL DEFAULT true,
    "supportsDeepLink" BOOLEAN NOT NULL DEFAULT true,
    "supportsClickTracking" BOOLEAN NOT NULL DEFAULT true,
    "supportsConversionTracking" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "websiteUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HotelProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateHotel" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "starRating" DOUBLE PRECISION,
    "guestRating" DOUBLE PRECISION,
    "reviewCount" INTEGER,
    "primaryPhotoUrl" TEXT,
    "photos" TEXT[],
    "facilities" TEXT[],
    "currency" TEXT,
    "lastKnownPriceCents" INTEGER,
    "lastFetchedAt" TIMESTAMP(3),
    "slug" TEXT NOT NULL,
    "rawData" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliateHotel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateHotelRoom" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "externalRoomId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "maxGuests" INTEGER,
    "currency" TEXT,
    "priceCents" INTEGER,
    "refundable" BOOLEAN,
    "lastFetchedAt" TIMESTAMP(3),
    "rawData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliateHotelRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateSearch" (
    "id" TEXT NOT NULL,
    "providerId" TEXT,
    "destination" TEXT NOT NULL,
    "destinationLat" DOUBLE PRECISION,
    "destinationLng" DOUBLE PRECISION,
    "checkIn" TIMESTAMP(3) NOT NULL,
    "checkOut" TIMESTAMP(3) NOT NULL,
    "adults" INTEGER NOT NULL DEFAULT 1,
    "children" INTEGER NOT NULL DEFAULT 0,
    "rooms" INTEGER NOT NULL DEFAULT 1,
    "resultCount" INTEGER,
    "userId" TEXT,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AffiliateSearch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateClick" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "searchId" TEXT,
    "subId" TEXT NOT NULL,
    "destination" TEXT,
    "checkIn" TIMESTAMP(3),
    "checkOut" TIMESTAMP(3),
    "deepLinkUrl" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "referrerPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AffiliateClick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateConversion" (
    "id" TEXT NOT NULL,
    "clickId" TEXT NOT NULL,
    "status" "AffiliateConversionStatus" NOT NULL DEFAULT 'PENDING',
    "externalBookingReference" TEXT,
    "bookingValueCents" INTEGER,
    "currency" TEXT,
    "commissionCents" INTEGER,
    "commissionConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "reportedAt" TIMESTAMP(3),
    "rawData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliateConversion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HotelProvider_code_key" ON "HotelProvider"("code");

-- CreateIndex
CREATE INDEX "HotelProvider_status_idx" ON "HotelProvider"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateHotel_slug_key" ON "AffiliateHotel"("slug");

-- CreateIndex
CREATE INDEX "AffiliateHotel_city_idx" ON "AffiliateHotel"("city");

-- CreateIndex
CREATE INDEX "AffiliateHotel_providerId_idx" ON "AffiliateHotel"("providerId");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateHotel_providerId_externalId_key" ON "AffiliateHotel"("providerId", "externalId");

-- CreateIndex
CREATE INDEX "AffiliateHotelRoom_hotelId_idx" ON "AffiliateHotelRoom"("hotelId");

-- CreateIndex
CREATE INDEX "AffiliateSearch_createdAt_idx" ON "AffiliateSearch"("createdAt");

-- CreateIndex
CREATE INDEX "AffiliateSearch_providerId_idx" ON "AffiliateSearch"("providerId");

-- CreateIndex
CREATE INDEX "AffiliateSearch_userId_idx" ON "AffiliateSearch"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateClick_subId_key" ON "AffiliateClick"("subId");

-- CreateIndex
CREATE INDEX "AffiliateClick_providerId_createdAt_idx" ON "AffiliateClick"("providerId", "createdAt");

-- CreateIndex
CREATE INDEX "AffiliateClick_hotelId_idx" ON "AffiliateClick"("hotelId");

-- CreateIndex
CREATE INDEX "AffiliateClick_searchId_idx" ON "AffiliateClick"("searchId");

-- CreateIndex
CREATE INDEX "AffiliateClick_userId_idx" ON "AffiliateClick"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateConversion_clickId_key" ON "AffiliateConversion"("clickId");

-- CreateIndex
CREATE INDEX "AffiliateConversion_status_idx" ON "AffiliateConversion"("status");

-- AddForeignKey
ALTER TABLE "AffiliateHotel" ADD CONSTRAINT "AffiliateHotel_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "HotelProvider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateHotelRoom" ADD CONSTRAINT "AffiliateHotelRoom_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "AffiliateHotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateSearch" ADD CONSTRAINT "AffiliateSearch_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "HotelProvider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateSearch" ADD CONSTRAINT "AffiliateSearch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateClick" ADD CONSTRAINT "AffiliateClick_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "HotelProvider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateClick" ADD CONSTRAINT "AffiliateClick_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "AffiliateHotel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateClick" ADD CONSTRAINT "AffiliateClick_searchId_fkey" FOREIGN KEY ("searchId") REFERENCES "AffiliateSearch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateClick" ADD CONSTRAINT "AffiliateClick_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateConversion" ADD CONSTRAINT "AffiliateConversion_clickId_fkey" FOREIGN KEY ("clickId") REFERENCES "AffiliateClick"("id") ON DELETE CASCADE ON UPDATE CASCADE;

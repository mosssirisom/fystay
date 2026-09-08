-- CreateEnum
CREATE TYPE "LocalDataSource" AS ENUM ('OSM', 'TICKETMASTER', 'OPEN_METEO', 'EDITORIAL');

-- CreateEnum
CREATE TYPE "LocalPlaceCategory" AS ENUM ('RESTAURANT', 'CAFE', 'PUB', 'SHOP', 'SUPERMARKET', 'PHARMACY', 'PARK', 'BEACH', 'PLAYGROUND', 'ATTRACTION', 'MUSEUM', 'TOILET', 'PARKING', 'EV_CHARGING', 'VIEWPOINT', 'OTHER');

-- CreateEnum
CREATE TYPE "EditorialTag" AS ENUM ('FYSTAY_PICK', 'HIDDEN_GEM', 'BEST_FOR_FAMILIES', 'BEST_FOR_COUPLES', 'BEST_CHEAP_EAT', 'BEST_BREAKFAST', 'BEST_BEACH', 'BEST_WALK', 'BEST_RAINY_DAY');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('SUCCESS', 'PARTIAL', 'FAILURE', 'SKIPPED');

-- CreateTable
CREATE TABLE "LocalTown" (
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "LocalTown_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "LocalPlace" (
    "id" TEXT NOT NULL,
    "source" "LocalDataSource" NOT NULL,
    "sourceId" TEXT,
    "townSlug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "LocalPlaceCategory" NOT NULL,
    "description" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "address" TEXT,
    "openingHours" TEXT,
    "website" TEXT,
    "phone" TEXT,
    "rating" DOUBLE PRECISION,
    "priceLevel" INTEGER,
    "imageUrl" TEXT,
    "familyFriendly" BOOLEAN,
    "dogFriendly" BOOLEAN,
    "accessibility" TEXT,
    "rawData" JSONB,
    "lastFetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocalPlace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocalEvent" (
    "id" TEXT NOT NULL,
    "source" "LocalDataSource" NOT NULL DEFAULT 'TICKETMASTER',
    "sourceId" TEXT NOT NULL,
    "townSlug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "venueName" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "url" TEXT,
    "imageUrl" TEXT,
    "priceRange" TEXT,
    "rawData" JSONB,
    "lastFetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocalEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeatherCache" (
    "townSlug" TEXT NOT NULL,
    "current" JSONB NOT NULL,
    "daily" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeatherCache_pkey" PRIMARY KEY ("townSlug")
);

-- CreateTable
CREATE TABLE "EditorialRecommendation" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "townSlug" TEXT NOT NULL,
    "placeId" TEXT,
    "tag" "EditorialTag" NOT NULL,
    "name" TEXT NOT NULL,
    "category" "LocalPlaceCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "rank" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EditorialRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedPlace" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,

    CONSTRAINT "SavedPlace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiSyncLog" (
    "id" TEXT NOT NULL,
    "source" "LocalDataSource" NOT NULL,
    "townSlug" TEXT,
    "status" "SyncStatus" NOT NULL,
    "recordCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiSyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LocalPlace_townSlug_category_idx" ON "LocalPlace"("townSlug", "category");

-- CreateIndex
CREATE UNIQUE INDEX "LocalPlace_source_sourceId_key" ON "LocalPlace"("source", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "LocalEvent_sourceId_key" ON "LocalEvent"("sourceId");

-- CreateIndex
CREATE INDEX "LocalEvent_townSlug_startsAt_idx" ON "LocalEvent"("townSlug", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "EditorialRecommendation_slug_key" ON "EditorialRecommendation"("slug");

-- CreateIndex
CREATE INDEX "EditorialRecommendation_townSlug_tag_idx" ON "EditorialRecommendation"("townSlug", "tag");

-- CreateIndex
CREATE UNIQUE INDEX "SavedPlace_userId_placeId_key" ON "SavedPlace"("userId", "placeId");

-- CreateIndex
CREATE INDEX "ApiSyncLog_source_startedAt_idx" ON "ApiSyncLog"("source", "startedAt");

-- AddForeignKey
ALTER TABLE "LocalPlace" ADD CONSTRAINT "LocalPlace_townSlug_fkey" FOREIGN KEY ("townSlug") REFERENCES "LocalTown"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocalEvent" ADD CONSTRAINT "LocalEvent_townSlug_fkey" FOREIGN KEY ("townSlug") REFERENCES "LocalTown"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeatherCache" ADD CONSTRAINT "WeatherCache_townSlug_fkey" FOREIGN KEY ("townSlug") REFERENCES "LocalTown"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditorialRecommendation" ADD CONSTRAINT "EditorialRecommendation_townSlug_fkey" FOREIGN KEY ("townSlug") REFERENCES "LocalTown"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditorialRecommendation" ADD CONSTRAINT "EditorialRecommendation_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "LocalPlace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedPlace" ADD CONSTRAINT "SavedPlace_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedPlace" ADD CONSTRAINT "SavedPlace_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "LocalPlace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

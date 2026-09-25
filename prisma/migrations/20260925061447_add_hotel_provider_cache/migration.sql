-- CreateTable
CREATE TABLE "HotelProviderCacheEntry" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cacheKey" TEXT NOT NULL,
    "providerCode" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HotelProviderCacheEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HotelProviderCacheEntry_cacheKey_key" ON "HotelProviderCacheEntry"("cacheKey");

-- CreateIndex
CREATE INDEX "HotelProviderCacheEntry_expiresAt_idx" ON "HotelProviderCacheEntry"("expiresAt");

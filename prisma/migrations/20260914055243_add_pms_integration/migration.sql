-- CreateEnum
CREATE TYPE "PmsProvider" AS ENUM ('CLOUDBEDS', 'SITEMINDER', 'SUPERCONTROL');

-- CreateEnum
CREATE TYPE "PmsConnectionStatus" AS ENUM ('DISCONNECTED', 'CONNECTED', 'ERROR');

-- CreateEnum
CREATE TYPE "PmsSyncKind" AS ENUM ('AVAILABILITY', 'RATES', 'RESTRICTIONS', 'RESERVATIONS_IMPORT', 'RESERVATION_PUSH', 'CANCELLATION_PUSH', 'FULL_RECONCILE');

-- AlterEnum
ALTER TYPE "AvailabilityBlockSource" ADD VALUE 'PMS_IMPORT';

-- CreateTable
CREATE TABLE "PmsConnection" (
    "id" TEXT NOT NULL,
    "provider" "PmsProvider" NOT NULL,
    "status" "PmsConnectionStatus" NOT NULL DEFAULT 'DISCONNECTED',
    "externalPropertyId" TEXT,
    "externalPropertyName" TEXT,
    "credentialsCiphertext" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "connectedAt" TIMESTAMP(3),
    "disconnectedAt" TIMESTAMP(3),
    "lastSyncedAt" TIMESTAMP(3),
    "lastSyncStatus" "SyncStatus",
    "lastSyncError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "hostId" TEXT NOT NULL,

    CONSTRAINT "PmsConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PmsRoomMapping" (
    "id" TEXT NOT NULL,
    "externalRoomId" TEXT NOT NULL,
    "externalRoomName" TEXT,
    "connectionId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "roomTypeId" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PmsRoomMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PmsReservationLink" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "externalReservationId" TEXT,
    "pushStatus" "SyncStatus",
    "pushError" TEXT,
    "pushAttempts" INTEGER NOT NULL DEFAULT 0,
    "pushedAt" TIMESTAMP(3),
    "cancelPushStatus" "SyncStatus",
    "cancelPushError" TEXT,
    "cancelPushAttempts" INTEGER NOT NULL DEFAULT 0,
    "cancelPushedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PmsReservationLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PmsSyncLog" (
    "id" TEXT NOT NULL,
    "kind" "PmsSyncKind" NOT NULL,
    "status" "SyncStatus" NOT NULL,
    "recordCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3) NOT NULL,
    "connectionId" TEXT NOT NULL,

    CONSTRAINT "PmsSyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PmsWebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" "PmsProvider" NOT NULL,
    "externalEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3),
    "status" "SyncStatus",
    "errorMessage" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "connectionId" TEXT,

    CONSTRAINT "PmsWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PmsConnection_hostId_idx" ON "PmsConnection"("hostId");

-- CreateIndex
CREATE UNIQUE INDEX "PmsConnection_hostId_provider_key" ON "PmsConnection"("hostId", "provider");

-- CreateIndex
CREATE INDEX "PmsRoomMapping_listingId_idx" ON "PmsRoomMapping"("listingId");

-- CreateIndex
CREATE INDEX "PmsRoomMapping_roomTypeId_idx" ON "PmsRoomMapping"("roomTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "PmsRoomMapping_connectionId_externalRoomId_key" ON "PmsRoomMapping"("connectionId", "externalRoomId");

-- CreateIndex
CREATE UNIQUE INDEX "PmsReservationLink_bookingId_key" ON "PmsReservationLink"("bookingId");

-- CreateIndex
CREATE INDEX "PmsReservationLink_connectionId_idx" ON "PmsReservationLink"("connectionId");

-- CreateIndex
CREATE UNIQUE INDEX "PmsReservationLink_connectionId_externalReservationId_key" ON "PmsReservationLink"("connectionId", "externalReservationId");

-- CreateIndex
CREATE INDEX "PmsSyncLog_connectionId_startedAt_idx" ON "PmsSyncLog"("connectionId", "startedAt");

-- CreateIndex
CREATE INDEX "PmsWebhookEvent_connectionId_idx" ON "PmsWebhookEvent"("connectionId");

-- CreateIndex
CREATE UNIQUE INDEX "PmsWebhookEvent_provider_externalEventId_key" ON "PmsWebhookEvent"("provider", "externalEventId");

-- AddForeignKey
ALTER TABLE "PmsConnection" ADD CONSTRAINT "PmsConnection_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PmsRoomMapping" ADD CONSTRAINT "PmsRoomMapping_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "PmsConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PmsRoomMapping" ADD CONSTRAINT "PmsRoomMapping_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PmsRoomMapping" ADD CONSTRAINT "PmsRoomMapping_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "RoomType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PmsReservationLink" ADD CONSTRAINT "PmsReservationLink_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "PmsConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PmsReservationLink" ADD CONSTRAINT "PmsReservationLink_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PmsSyncLog" ADD CONSTRAINT "PmsSyncLog_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "PmsConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PmsWebhookEvent" ADD CONSTRAINT "PmsWebhookEvent_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "PmsConnection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

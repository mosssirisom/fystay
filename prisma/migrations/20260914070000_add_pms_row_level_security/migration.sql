-- ============================================================================
-- Defense-in-depth for the PMS integration tables: real Postgres Row Level
-- Security, on top of (never instead of) the NextAuth-session + ownership
-- check every /api/host/pms/* route already does in application code.
--
-- WHY THIS EXISTS: the rest of this schema has no RLS anywhere (no per-request
-- Postgres identity, no Supabase Auth/PostgREST in front of it - this app
-- talks to Postgres only through Prisma, using one shared DB role for
-- everything). Retrofitting genuine RLS across the *whole* schema would be a
-- much larger, separate migration. This one is scoped specifically to the
-- five PMS tables, where a leak would mean one host reading or tampering with
-- another host's PMS credentials, room mappings, or sync history.
--
-- HOW IT WORKS: a new, restricted, non-superuser role
-- (fystay_pms_host_scoped) is granted access to exactly the rows/columns the
-- host-facing PMS routes need, and RLS policies on the five PMS tables key
-- off a Postgres session variable, app.current_host_id, that the app sets
-- via set_config() for the lifetime of one transaction (see
-- src/lib/pms/hostScopedPrisma.ts). A query that never sets that variable
-- sees zero rows (current_setting(..., true) returns NULL, and NULL never
-- equals a real hostId) - this fails closed, not open.
--
-- WHAT THIS DOES NOT COVER: the nightly reconciliation cron
-- (/api/cron/pms-reconcile) and the inbound webhook receiver
-- (/api/webhooks/pms/[provider]) are trusted system jobs that must legitimately
-- touch every host's connections, not one host's own session - they keep
-- using the regular, unscoped Prisma client, the same way Supabase's own
-- service_role is meant to bypass RLS for trusted backend work. This
-- boundary protects against a *user-session-driven* request leaking across
-- tenants, which is the actual gap being closed here.
--
-- DELIBERATELY NOT USING "FORCE ROW LEVEL SECURITY": Postgres already
-- exempts a table's owner from its own RLS policies, and this app's main
-- DATABASE_URL role (the one that ran this migration, and the one the
-- system jobs above connect as) is that owner - FORCE would strip that
-- exemption and break the cron/webhook paths' need to see every host's
-- rows. Confirmed locally: with FORCE on, even the owner role got a "new
-- row violates row-level security policy" error on a plain insert.
--
-- REQUIRED MANUAL STEP AFTER THIS MIGRATION RUNS (do this yourself, never
-- commit a real password to source control):
--   ALTER ROLE fystay_pms_host_scoped WITH PASSWORD '<a-real-generated-secret>';
-- Then set PMS_HOST_SCOPED_DATABASE_URL to that role's connection string
-- (same host/port/database as DATABASE_URL, different user/password) in your
-- production environment. Until both of those are done, the role has no
-- usable password and PMS_HOST_SCOPED_DATABASE_URL stays unset, so
-- withHostScope() falls back to the plain Prisma client - exactly today's
-- behavior, application-layer checks only. Nothing breaks either way.
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'fystay_pms_host_scoped') THEN
    CREATE ROLE fystay_pms_host_scoped LOGIN;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO fystay_pms_host_scoped;

-- Full CRUD on the PMS tables themselves - RLS policies below scope every
-- row access to the calling host.
GRANT SELECT, INSERT, UPDATE, DELETE ON
  "PmsConnection",
  "PmsRoomMapping",
  "PmsReservationLink",
  "PmsSyncLog",
  "PmsWebhookEvent"
TO fystay_pms_host_scoped;

-- AvailabilityBlock: the sync engine creates/updates/deletes PMS_IMPORT rows
-- here (see pullReservationsForMapping in src/lib/pms/sync.ts). Not RLS-
-- scoped itself (that would mean retrofitting RLS onto a table every other,
-- non-PMS feature also writes to) - reachable only via mappings that are
-- themselves already host-scoped.
GRANT SELECT, INSERT, UPDATE, DELETE ON "AvailabilityBlock" TO fystay_pms_host_scoped;

-- Read-only, narrow: ownership checks (Listing.hostId, RoomType.listingId)
-- and reading a booking's own details when pushing it to a PMS.
GRANT SELECT ON "User", "Listing", "RoomType", "Booking" TO fystay_pms_host_scoped;

-- Column-scoped write access: the only two things a PMS rate/restriction
-- pull is ever allowed to change (see pullRateForMapping/
-- pullRestrictionsForMapping) - never a listing's title, host, publish
-- state, or anything else, even though this role can SELECT the whole row.
GRANT UPDATE ("pricePerNightCents", "minNights") ON "Listing" TO fystay_pms_host_scoped;
GRANT UPDATE ("pricePerNightCents") ON "RoomType" TO fystay_pms_host_scoped;

-- ----------------------------------------------------------------------------
-- PmsConnection: directly owned by a host.
-- ----------------------------------------------------------------------------
ALTER TABLE "PmsConnection" ENABLE ROW LEVEL SECURITY;

CREATE POLICY pms_connection_host_isolation ON "PmsConnection"
  USING ("hostId" = current_setting('app.current_host_id', true))
  WITH CHECK ("hostId" = current_setting('app.current_host_id', true));

-- ----------------------------------------------------------------------------
-- PmsRoomMapping, PmsReservationLink, PmsSyncLog: owned via connectionId.
-- ----------------------------------------------------------------------------
ALTER TABLE "PmsRoomMapping" ENABLE ROW LEVEL SECURITY;

CREATE POLICY pms_room_mapping_host_isolation ON "PmsRoomMapping"
  USING (EXISTS (
    SELECT 1 FROM "PmsConnection" c
    WHERE c.id = "PmsRoomMapping"."connectionId"
      AND c."hostId" = current_setting('app.current_host_id', true)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM "PmsConnection" c
    WHERE c.id = "PmsRoomMapping"."connectionId"
      AND c."hostId" = current_setting('app.current_host_id', true)
  ));

ALTER TABLE "PmsReservationLink" ENABLE ROW LEVEL SECURITY;

CREATE POLICY pms_reservation_link_host_isolation ON "PmsReservationLink"
  USING (EXISTS (
    SELECT 1 FROM "PmsConnection" c
    WHERE c.id = "PmsReservationLink"."connectionId"
      AND c."hostId" = current_setting('app.current_host_id', true)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM "PmsConnection" c
    WHERE c.id = "PmsReservationLink"."connectionId"
      AND c."hostId" = current_setting('app.current_host_id', true)
  ));

ALTER TABLE "PmsSyncLog" ENABLE ROW LEVEL SECURITY;

CREATE POLICY pms_sync_log_host_isolation ON "PmsSyncLog"
  USING (EXISTS (
    SELECT 1 FROM "PmsConnection" c
    WHERE c.id = "PmsSyncLog"."connectionId"
      AND c."hostId" = current_setting('app.current_host_id', true)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM "PmsConnection" c
    WHERE c.id = "PmsSyncLog"."connectionId"
      AND c."hostId" = current_setting('app.current_host_id', true)
  ));

-- ----------------------------------------------------------------------------
-- PmsWebhookEvent: connectionId is nullable (an event can arrive before this
-- app can resolve which connection it belongs to - see that model's own
-- schema comment). The host-scoped role only ever needs to read this table
-- for a connection it already owns; a row with no resolved connection yet is
-- never visible to it (system-only, via the unscoped webhook receiver).
-- ----------------------------------------------------------------------------
ALTER TABLE "PmsWebhookEvent" ENABLE ROW LEVEL SECURITY;

CREATE POLICY pms_webhook_event_host_isolation ON "PmsWebhookEvent"
  USING (EXISTS (
    SELECT 1 FROM "PmsConnection" c
    WHERE c.id = "PmsWebhookEvent"."connectionId"
      AND c."hostId" = current_setting('app.current_host_id', true)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM "PmsConnection" c
    WHERE c.id = "PmsWebhookEvent"."connectionId"
      AND c."hostId" = current_setting('app.current_host_id', true)
  ));

# Hotel provider integration runbook

**Status: Booking.com is NOT live.** As of this writing, `booking_com` is a
registered adapter (`src/lib/hotelProviders/providers/bookingCom.ts`) whose
every method throws before doing anything - either because credentials are
unset, or (even once they're set) because the request/response shapes and
deep-link format haven't been confirmed against Booking.com's live API. No
`HotelProvider` row with `code: "booking_com"` is ever seeded, and
`LIVE_HOTEL_PROVIDER_CODES` (`src/lib/hotelProviders/registry.ts`) does not
list it. This document is what has to happen, in order, before any of that
changes - it is not a description of current behaviour.

This runbook covers connecting *any* real hotel provider through the
existing `HotelProviderAdapter` abstraction. Booking.com is used as the
worked example because it's the provider already stubbed out, but nothing
here is Booking.com-specific except where explicitly labelled.

---

## 1. Credentials

| Env var | Where it belongs | Notes |
|---|---|---|
| `BOOKING_COM_API_KEY` | Server-only env var (Vercel project env, never `NEXT_PUBLIC_*`) | Issued via the Booking.com Affiliate Partner Centre. Rotate every 12 months per Booking.com's own recommendation. |
| `BOOKING_COM_AFFILIATE_ID` | Same as above | Identifies the affiliate account in every request. |
| `BOOKING_COM_API_BASE_URL` | Same as above, optional | Defaults to the confirmed sandbox host (`https://demandapi-sandbox.booking.com`). Only ever set to a production host once you have specifically decided to go live - never as a default, and never committed anywhere. |

**Which environments need them**: production and any preview/staging
environment that should exercise real Booking.com traffic. Local
development and CI should keep these unset and use the `mock` provider
instead - that's what it exists for.

**Storage**: Vercel project environment variables (or your platform's
equivalent secret store), scoped per-environment. Never in `.env` files
committed to git, never in `NEXT_PUBLIC_*` variables, never logged (see
Security below).

---

## 2. Provider specification - what must be confirmed before writing code

`bookingCom.ts`'s own top-of-file comment is the authoritative, current
ledger of what's confirmed vs. not - read it first; don't duplicate or
re-derive it here, since it will go stale independently of this doc. As of
this phase, confirmed: auth headers (`Authorization: Bearer`,
`X-Affiliate-Id`), the sandbox host, and that Managed Affiliate Partner
status + a signed contract are required just to get Partner Centre access.
**Not confirmed - required before implementation, not to be guessed**:

- API base URL / path segment (search, hotel details, availability, rates
  and rooms) - confirmed only by reading Booking.com's own live OpenAPI
  spec once partner access exists (never invented, never inferred from a
  training-data guess or a paraphrased blog post).
- Full request/response schemas for search, hotel details, and
  availability.
- The rate/room schema (what fields a "deal" actually carries).
- The error response schema (status codes, error body shape) - needed to
  correctly set `HotelProviderAdapterError.retryable` per error type (a 429
  or 5xx should be retryable; a 400/401/403 should not).
- Rate limits (requests/minute or /day) - needed to size
  `HOTEL_PROVIDER_MAX_ATTEMPTS`/backoff sensibly and to decide whether the
  cache TTLs in `cache.ts` need lengthening for this specific provider.
- Realistic timeout expectations (p50/p99 latency) - needed to tune
  `HOTEL_PROVIDER_TIMEOUT_MS` correctly; the current 8000ms default is a
  generic placeholder, not validated against any real provider.

## 3. Affiliate tracking - what must be confirmed

- **Deep-link/redirect URL format**: the single most important unconfirmed
  fact. Until this is read from Booking.com's own affiliate documentation,
  `createDeepLink()` must keep throwing rather than guessing at a URL
  shape - a wrong deep link either loses commission attribution silently or
  sends a guest to a broken page.
- **Required affiliate parameters**: which query params/headers Booking.com
  expects to attribute a click (their own "aid"/sub-id mechanism or
  equivalent).
- **Sub-ID/tracking requirements**: confirm the accepted format/length for
  a sub-ID before wiring `computeClickSubId`'s output into it - the current
  32-hex-char `hc_...` format is FYStay's own convention, not validated
  against any provider's actual constraints.
- **Attribution rules**: how long after a click Booking.com will still
  attribute a resulting booking (their "cookie window" equivalent) - this
  affects how confidently `AffiliateConversion` rows can be trusted to
  correspond to a specific click.
- **Conversion/postback requirements**: what access level, format, and
  authentication Booking.com's reporting/postback API needs before
  `supportsConversionTracking` can honestly become `true` for this
  provider. Until then it must stay `false` (see `AffiliateConversion`'s
  own schema comment on why a fabricated conversion is never acceptable).

---

## 4. Application changes required once the above is confirmed

In the order they'd actually need implementing:

1. **`src/lib/hotelProviders/providers/bookingCom.ts`** - replace each
   `notYetConfirmed(...)` call with a real implementation, following the
   confirmed schemas exactly. `getBookingComCredentials()` stays as-is.
2. **`src/lib/hotelProviders/click.ts`** - add `"booking_com"` to
   `ALLOWED_DEEP_LINK_HOSTS` with the confirmed real host(s), *only* once
   `createDeepLink()` is implemented and manually verified to only ever
   return URLs on that host.
3. **Database**: seed (or have an admin create via `/api/admin/*` tooling,
   if built) a real `HotelProvider` row with `code: "booking_com"` and
   `status: "INACTIVE"` initially - creating the row is not the same as
   going live (see Section 5).
4. **`src/lib/hotelProviders/registry.ts`** - add `"booking_com"` to
   `LIVE_HOTEL_PROVIDER_CODES`. This is the second, independent gate (see
   Section 5) - do this only after Section 6's testing checklist passes in
   full against the sandbox.
5. **Tuning**: revisit `HOTEL_PROVIDER_TIMEOUT_MS`,
   `HOTEL_PROVIDER_MAX_ATTEMPTS`, and the two cache TTL env vars against
   Booking.com's actual confirmed latency/rate-limit numbers from Section 2
   - the shipped defaults are generic placeholders, not tuned to any real
   provider.
6. No changes needed anywhere else: `search.ts`, the redirect route, the
   admin dashboard, and every UI component already call through the
   `HotelProviderAdapter` abstraction and the resilience/cache wrappers -
   that's the whole point of Phase 12.

---

## 5. Going live is two deliberate, independent switches - never one

A provider must never become "live" just because credentials happen to be
set. Two separate things both have to be true:

1. `HotelProvider.status = "ACTIVE"` in the database (controls whether
   `search.ts` will actually query it), **and**
2. The provider's code is added to `LIVE_HOTEL_PROVIDER_CODES` in
   `registry.ts` (an independent, code-level acknowledgement that this
   provider's adapter is genuinely implemented and tested, not just that
   someone flipped a database flag).

Flipping only one of these does nothing by itself - flipping the DB status
without the registry entry doesn't change any application behavior beyond a
cosmetic dashboard signal; the registry constant is read by nothing that
gates traffic today, but is kept as the documented, load-bearing convention
this codebase uses to answer "is this genuinely live" without trusting the
database alone. Do not remove or repurpose this constant to "simplify"
things - it is the single place a future audit checks to answer "could a
provider have gone live by accident."

---

## 6. Testing - what must pass before a provider can be marked live

All of the following, against the confirmed sandbox (never production,
until every one of these has passed against sandbox first):

- [ ] Unit tests for the real adapter implementation: successful response
  parsing, malformed/partial response handling, and every documented error
  status mapped to the correct `retryable` value.
- [ ] `resilience.ts`'s existing tests still pass unmodified - the adapter
  change should need zero changes there (it's provider-agnostic by
  construction).
- [ ] `cache.ts`'s existing tests still pass unmodified, plus a manual
  sanity check that a real search/availability call is actually being
  cached (check `HotelProviderCacheEntry` rows) and expiring on schedule.
- [ ] A live sandbox smoke test: real search, real hotel details, real
  availability, for at least 3 different real destinations/date ranges.
- [ ] A live sandbox click: confirm the generated deep link resolves to a
  real Booking.com sandbox page, and that `AffiliateClick.deepLinkUrl`
  matches exactly what was followed.
- [ ] Rate-limit behavior confirmed: intentionally exceed the documented
  rate limit against sandbox and confirm the adapter surfaces a retryable
  `HotelProviderAdapterError`, not a crash or a silently-wrong result.
- [ ] `e2e/hotel-affiliate.spec.ts` passes unmodified with `mock` still the
  only provider exercised by that suite (it should never need to change to
  accommodate a new provider - if it does, something leaked provider-
  specific logic outside the adapter).
- [ ] A new, provider-specific e2e smoke test added for `booking_com`
  itself, run against sandbox only, never in the default CI run against
  production credentials.
- [ ] Full regression: `npx vitest run`, `npx tsc --noEmit`,
  `npx eslint . --max-warnings=0`, `npm run build` all clean.
- [ ] Manual review: confirm no credential, sandbox/production host, or
  real guest PII ever appears in a log line (see Security below).

Only once every box above is checked against sandbox does flipping both
switches in Section 5 - with production credentials - become appropriate.
Do that as its own deliberate, reviewed change, not bundled into an
unrelated feature commit.

---

## 7. Security

- **Server-side secret handling**: every credential is read only inside
  `getBookingComCredentials()` (server-only module, never imported from a
  `"use client"` file) and never returned from any function, logged, or
  serialized into a response. This pattern must not change when the real
  implementation is written in.
- **Deep-link allowlisting**: `ALLOWED_DEEP_LINK_HOSTS` in `click.ts` is
  the last line of defense against a future adapter bug returning an
  unexpected host - adding a provider here is always paired with manually
  confirming `createDeepLink()` genuinely only ever returns that host, not
  assumed from documentation alone.
- **Credential handling**: never commit a `.env` file with real values;
  `.env.example` documents every variable name with an empty value only.
  Rotate `BOOKING_COM_API_KEY` per Booking.com's own 12-month
  recommendation once live.
- **Logging restrictions**: `console.error` calls throughout this package
  (search.ts, cache.ts, resilience.ts) log `Error` objects, which must
  never be constructed with a credential or full request payload embedded
  in the message. Review any new adapter code for this before merging.
- **PII considerations**: `AffiliateClick` already stores `ipAddress`,
  `userAgent`, and (for logged-in users) `userId` - this predates Phase 12
  and is unchanged by it. A real provider's error responses or logs must
  never be persisted verbatim if they could contain another guest's PII
  (unlikely for a hotel-search API, but verify against the confirmed error
  schema in Section 2 before shipping).

---

## 8. What Phase 12 already built, ready for a real provider to use for free

- **Timeout + retry** (`src/lib/hotelProviders/resilience.ts`): wraps
  every adapter automatically via `registry.ts` - a real provider gets
  this with zero extra code.
- **Caching** (`src/lib/hotelProviders/cache.ts`): same - automatic via
  `registry.ts`, provider-scoped cache keys, safe TTLs for price/inventory
  data.
- **`LIVE_HOTEL_PROVIDER_CODES`**: the deliberate go-live gate described in
  Section 5.

None of this required, or should ever require, a single Booking.com-shaped
conditional anywhere in the application.

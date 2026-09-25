import type { HotelProviderAdapter } from "@/lib/hotelProviders/types";
import { HotelProviderAdapterError, HotelProviderTimeoutError } from "@/lib/hotelProviders/types";

/**
 * Provider-agnostic timeout + bounded-retry wrapper around the three async
 * HotelProviderAdapter methods (searchHotels/getHotelDetails/getAvailability
 * - never createDeepLink, which HotelProviderAdapter's own contract
 * documents as a synchronous, pure string builder with no I/O to time out or
 * retry). Deliberately knows nothing about any specific provider: it only
 * ever inspects HotelProviderAdapterError.retryable, the exact flag every
 * adapter (mock, booking_com, and any future one) already sets for this
 * purpose. Wired in once, in registry.ts, so every existing call site
 * (search.ts, the redirect route) gets this behaviour automatically without
 * importing or knowing about this module at all.
 */

export type ResilienceConfig = {
  /** How long a single attempt is allowed to run before it's treated as a timeout. */
  timeoutMs: number;
  /** Total attempts, including the first - e.g. 3 means "try once, then up to 2 retries". */
  maxAttempts: number;
  /** Delay before the first retry; each subsequent retry doubles this, capped at maxDelayMs. */
  baseDelayMs: number;
  maxDelayMs: number;
};

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * Defaults: 8s per attempt and up to 2 retries is generous enough for a
 * real third-party hotel API (search/availability calls routinely take
 * 1-3s) without leaving a guest staring at a spinner for the ~24s a naive
 * "always retry to the limit" policy could otherwise cost on a fully-down
 * provider. Backoff starts at 200ms (imperceptible) and caps at 2s (still
 * fast enough that three attempts finish well inside typical page-load
 * patience). Overridable via env for production tuning without a code
 * change - see .env.example. baseDelayMs/maxDelayMs are intentionally not
 * env-configurable: they're internal tuning, not an operational limit
 * anyone needs to change without also reconsidering the timeout/attempts
 * budget alongside them.
 */
export const DEFAULT_RESILIENCE_CONFIG: ResilienceConfig = {
  timeoutMs: envInt("HOTEL_PROVIDER_TIMEOUT_MS", 8000),
  maxAttempts: envInt("HOTEL_PROVIDER_MAX_ATTEMPTS", 3),
  baseDelayMs: 200,
  maxDelayMs: 2000,
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Races `fn` against a timer, rejecting with HotelProviderTimeoutError if the timer wins first. Never leaves the timer running past whichever settles first. */
function withTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new HotelProviderTimeoutError(timeoutMs)), timeoutMs);
    fn().then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

/**
 * Runs `fn` under a timeout, retrying only when the failure is a
 * HotelProviderAdapterError with retryable: true (a timeout always
 * qualifies - see HotelProviderTimeoutError). Anything else - a
 * non-retryable adapter error (e.g. missing/invalid credentials) or a
 * genuinely unexpected bug that isn't even a HotelProviderAdapterError -
 * propagates immediately on the first attempt, exactly as it did before
 * this wrapper existed, so every existing "re-throw unexpected errors"
 * behaviour in search.ts is unaffected.
 */
export async function withRetry<T>(fn: () => Promise<T>, config: ResilienceConfig = DEFAULT_RESILIENCE_CONFIG): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await withTimeout(fn, config.timeoutMs);
    } catch (err) {
      lastError = err;
      const retryable = err instanceof HotelProviderAdapterError && err.retryable;
      const attemptsRemain = attempt < config.maxAttempts;
      if (!retryable || !attemptsRemain) throw err;
      const backoff = Math.min(config.baseDelayMs * 2 ** (attempt - 1), config.maxDelayMs);
      await delay(backoff);
    }
  }
  // Unreachable (the loop above always either returns or throws), but
  // satisfies TypeScript's control-flow analysis without an `as never`.
  throw lastError;
}

/**
 * Wraps every async method of `adapter` in withRetry, leaving `code`,
 * `name`, the capability flags, and createDeepLink completely untouched.
 * This is the one function registry.ts calls - nothing else in the app
 * needs to know this wrapper exists.
 */
export function withResilientAdapter(
  adapter: HotelProviderAdapter,
  config: ResilienceConfig = DEFAULT_RESILIENCE_CONFIG,
): HotelProviderAdapter {
  return {
    ...adapter,
    searchHotels: (params) => withRetry(() => adapter.searchHotels(params), config),
    getHotelDetails: (externalId) => withRetry(() => adapter.getHotelDetails(externalId), config),
    getAvailability: (externalId, params) => withRetry(() => adapter.getAvailability(externalId, params), config),
  };
}

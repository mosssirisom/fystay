import { describe, expect, it, vi } from "vitest";
import { HotelProviderAdapterError, HotelProviderTimeoutError } from "@/lib/hotelProviders/types";
import { withResilientAdapter, withRetry, type ResilienceConfig } from "@/lib/hotelProviders/resilience";
import { createFixtureAdapter } from "@/lib/hotelProviders/testFixtures";

/** Small, fast config for tests - real timeouts/backoff would make this suite slow without adding any coverage. */
const FAST_CONFIG: ResilienceConfig = { timeoutMs: 30, maxAttempts: 3, baseDelayMs: 2, maxDelayMs: 5 };

function neverResolves<T>(): Promise<T> {
  return new Promise<T>(() => {});
}

describe("withRetry: timeout", () => {
  it("returns normally when the provider responds within the timeout", async () => {
    const result = await withRetry(() => Promise.resolve("ok"), FAST_CONFIG);
    expect(result).toBe("ok");
  });

  it("rejects with HotelProviderTimeoutError when the provider exceeds the timeout, without waiting for it to ever settle", async () => {
    const start = Date.now();
    await expect(withRetry(() => neverResolves(), { ...FAST_CONFIG, maxAttempts: 1 })).rejects.toThrow(
      HotelProviderTimeoutError,
    );
    // Generous upper bound - this only needs to prove we didn't wait
    // anywhere near "forever", not pin down exact scheduler timing.
    expect(Date.now() - start).toBeLessThan(500);
  });

  it("surfaces the timeout as both a HotelProviderTimeoutError and a retryable HotelProviderAdapterError", async () => {
    await expect(withRetry(() => neverResolves(), { ...FAST_CONFIG, maxAttempts: 1 })).rejects.toSatisfy((err: unknown) => {
      return (
        err instanceof HotelProviderTimeoutError &&
        err instanceof HotelProviderAdapterError &&
        err.retryable === true
      );
    });
  });

  it("does not crash the caller when every attempt times out - it rejects cleanly, which is what search.ts's own catch(HotelProviderAdapterError) depends on", async () => {
    await expect(withRetry(() => neverResolves(), FAST_CONFIG)).rejects.toBeInstanceOf(HotelProviderAdapterError);
  });
});

describe("withRetry: retry policy", () => {
  it("retries a retryable provider error and returns normally once a later attempt succeeds", async () => {
    let calls = 0;
    const fn = vi.fn(async () => {
      calls++;
      if (calls < 2) throw new HotelProviderAdapterError("transient", { retryable: true });
      return "recovered";
    });

    const result = await withRetry(fn, FAST_CONFIG);

    expect(result).toBe("recovered");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("does not retry a non-retryable provider error - fails on the first attempt", async () => {
    const fn = vi.fn(async () => {
      throw new HotelProviderAdapterError("bad credentials", { retryable: false });
    });

    await expect(withRetry(fn, FAST_CONFIG)).rejects.toThrow("bad credentials");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("does not retry an unexpected error that isn't even a HotelProviderAdapterError", async () => {
    const bug = new TypeError("a real bug");
    const fn = vi.fn(async () => {
      throw bug;
    });

    await expect(withRetry(fn, FAST_CONFIG)).rejects.toThrow(bug);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("respects the configured retry limit and stops after maxAttempts", async () => {
    const fn = vi.fn(async () => {
      throw new HotelProviderAdapterError("always down", { retryable: true });
    });

    await expect(withRetry(fn, FAST_CONFIG)).rejects.toThrow("always down");
    expect(fn).toHaveBeenCalledTimes(FAST_CONFIG.maxAttempts);
  });
});

describe("withResilientAdapter", () => {
  it("works against the fixture adapter, not just the mock provider - proves this layer is genuinely provider-agnostic", async () => {
    const fixture = createFixtureAdapter({
      searchHotels: vi.fn().mockResolvedValue([{ externalId: "f:1", name: "Fixture", city: "Testville", country: "Testland", facilities: [], currency: "GBP", priceCents: 100 }]),
    });
    const wrapped = withResilientAdapter(fixture, FAST_CONFIG);

    const results = await wrapped.searchHotels({
      destination: "Testville",
      checkIn: new Date("2026-11-01"),
      checkOut: new Date("2026-11-02"),
      adults: 2,
      children: 0,
      rooms: 1,
    });

    expect(results).toHaveLength(1);
    expect(wrapped.code).toBe("fixture");
  });

  it("retries getAvailability transparently when the underlying adapter fails once with a retryable error", async () => {
    let calls = 0;
    const fixture = createFixtureAdapter({
      getAvailability: vi.fn(async () => {
        calls++;
        if (calls < 2) throw new HotelProviderAdapterError("flaky", { retryable: true });
        return [];
      }),
    });
    const wrapped = withResilientAdapter(fixture, FAST_CONFIG);

    const deals = await wrapped.getAvailability("f:1", {
      checkIn: new Date("2026-11-01"),
      checkOut: new Date("2026-11-02"),
      adults: 2,
      children: 0,
      rooms: 1,
    });

    expect(deals).toEqual([]);
    expect(calls).toBe(2);
  });

  it("leaves createDeepLink completely untouched - synchronous, no timeout/retry wrapping", () => {
    const fixture = createFixtureAdapter();
    const wrapped = withResilientAdapter(fixture, FAST_CONFIG);

    const url = wrapped.createDeepLink({
      externalId: "f:1",
      checkIn: new Date("2026-11-01"),
      checkOut: new Date("2026-11-02"),
      adults: 2,
      children: 0,
      rooms: 1,
      subId: "hc_test",
    });

    expect(url).toContain("fixture-provider.invalid");
  });
});

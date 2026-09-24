export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

/**
 * Formats an amount in whatever currency a hotel-affiliate provider quoted
 * it in - deliberately not routed through useFormattedPrice/formatPriceIn
 * (src/lib/currency.ts), which convert FYStay's own GBP-denominated prices
 * into a guest's browsing-currency preference using a static approximate
 * rate. A provider's quoted price is a real figure in a real currency, not
 * a GBP amount to re-convert - showing it as-is is the only accurate
 * option. Falls back to a plain "<code> <amount>" if the code isn't one
 * Intl recognizes (defensive only - every provider adapter's own currency
 * field is expected to already be a valid ISO 4217 code).
 */
export function formatProviderPrice(cents: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  } catch {
    return `${currencyCode} ${(cents / 100).toFixed(0)}`;
  }
}

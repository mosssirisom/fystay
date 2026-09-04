"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { formatPriceIn, isCurrencyCode, type CurrencyCode } from "@/lib/currency";

const STORAGE_KEY = "fystay-display-currency";

const CurrencyContext = createContext<{
  currency: CurrencyCode;
  setCurrency: (next: CurrencyCode) => void;
}>({ currency: "GBP", setCurrency: () => {} });

/**
 * A per-browser display preference only - see src/lib/currency.ts for why
 * this never touches what a guest is actually charged. Read from
 * localStorage after mount (not during the initial render) so server and
 * first-paint markup always agree on GBP, then a saved non-GBP choice
 * applies a moment later rather than causing a hydration mismatch.
 */
export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>("GBP");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing with an external system (localStorage) that's only readable post-mount, not derivable from props/state
      if (stored && isCurrencyCode(stored)) setCurrencyState(stored);
    } catch {
      // Private browsing / blocked storage - GBP stays the default.
    }
  }, []);

  function setCurrency(next: CurrencyCode) {
    setCurrencyState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Best-effort persistence only - the choice still applies for this page view.
    }
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>{children}</CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}

/** The one hook browsing surfaces should use to display a GBP amount -
 * never checkout, receipts, or anything else showing a real charge, which
 * must always read unambiguously as GBP. */
export function useFormattedPrice(gbpCents: number): string {
  const { currency } = useCurrency();
  return formatPriceIn(gbpCents, currency);
}

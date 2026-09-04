"use client";

import { useCurrency } from "@/components/CurrencyProvider";
import { SUPPORTED_CURRENCIES, isCurrencyCode } from "@/lib/currency";
import { Select } from "@/components/ui/Select";

export function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="display-currency" className="text-sm font-semibold text-foreground">
        Display currency
      </label>
      <Select
        id="display-currency"
        value={currency}
        onChange={(e) => {
          if (isCurrencyCode(e.target.value)) setCurrency(e.target.value);
        }}
        className="w-auto min-w-[9rem]"
      >
        {SUPPORTED_CURRENCIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.code} - {c.label}
          </option>
        ))}
      </Select>
      <p className="max-w-[16rem] text-xs text-zinc-500">
        Approximate, for browsing only - you always pay in GBP.
      </p>
    </div>
  );
}

"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/Select";
import { SORT_OPTIONS, parseSortParam } from "@/lib/listingSearch";

export function SortDropdown() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSort = parseSortParam(searchParams.get("sort") ?? undefined);

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "recommended") params.delete("sort");
    else params.set("sort", value);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <Select
      aria-label="Sort results"
      value={currentSort}
      onChange={(e) => handleChange(e.target.value)}
      className="w-auto"
    >
      {SORT_OPTIONS.map((option) => (
        <option key={option.key} value={option.key}>
          {option.label}
        </option>
      ))}
    </Select>
  );
}

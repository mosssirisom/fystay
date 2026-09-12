"use client";

import { useState } from "react";
import { toast } from "sonner";

type AppliedPromo = {
  code: string;
  discountCents: number;
  // The exact selection this promo was validated against - if any of these
  // change (different dates, guest count, or room quantity), the applied
  // promo is treated as stale rather than silently carried over onto a
  // different price, mirroring how BookingWidget/HotelBookingWidget already
  // track "has the checked availability gone stale" for the reserve button.
  selectionKey: string;
};

/**
 * Shared promo-code apply/preview logic for BookingWidget and
 * HotelBookingWidget - both call the same read-only availability endpoint
 * (see previewPromoDiscount in that route) to validate a code and preview
 * its discount before a booking exists, then pass the same code through at
 * reservation time. Never itself creates or holds a reservation.
 */
export function usePromoCode(params: {
  listingId: string;
  buildParams: () => URLSearchParams | null;
  /** A string uniquely identifying the current dates/guests/quantity selection. */
  selectionKey: string;
}) {
  const { listingId, buildParams, selectionKey } = params;
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [applyingPromo, setApplyingPromo] = useState(false);

  const promoActive = Boolean(appliedPromo && appliedPromo.selectionKey === selectionKey);
  const promoDiscountCents = promoActive ? appliedPromo!.discountCents : 0;
  const promoCodeToSubmit = promoActive ? appliedPromo!.code : undefined;

  async function applyPromoCode() {
    setPromoError(null);
    const code = promoCodeInput.trim();
    if (!code) return;

    const searchParams = buildParams();
    if (!searchParams) {
      setPromoError("Select your dates first.");
      return;
    }
    searchParams.set("promoCode", code);

    setApplyingPromo(true);
    try {
      const res = await fetch(`/api/listings/${listingId}/availability?${searchParams}`);
      const data = await res.json();

      if (!res.ok || !data.available) {
        setPromoError(data.error ?? "Those dates aren't available.");
        return;
      }
      if (!data.promo?.valid) {
        setPromoError(data.promo?.error ?? "Invalid promo code");
        setAppliedPromo(null);
        return;
      }

      setAppliedPromo({
        code: code.toUpperCase(),
        discountCents: data.promo.discountCents,
        selectionKey,
      });
      toast.success("Promo code applied");
    } catch {
      setPromoError("Something went wrong. Please try again.");
    } finally {
      setApplyingPromo(false);
    }
  }

  function clearPromoCode() {
    setAppliedPromo(null);
    setPromoCodeInput("");
    setPromoError(null);
  }

  return {
    promoCodeInput,
    setPromoCodeInput,
    promoError,
    applyingPromo,
    applyPromoCode,
    clearPromoCode,
    promoActive,
    appliedPromoCode: promoActive ? appliedPromo!.code : null,
    promoDiscountCents,
    promoCodeToSubmit,
  };
}

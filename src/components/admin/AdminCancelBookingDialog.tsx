"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Field, FieldHint, Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { formatPrice } from "@/lib/format";

/**
 * Support's manual cancel-and-refund action, calling POST
 * /api/admin/bookings/[id]/cancel - which reuses the exact same refund
 * logic as the guest-facing cancel flow (see cancelBookingAndRefund).
 * Leaving refundPercent blank defers to the listing's own cancellation
 * policy, same as a guest cancelling themselves; filling it in overrides
 * that for a goodwill/manual case.
 */
export function AdminCancelBookingDialog({
  bookingId,
  reference,
  policyLabel,
  policyDescription,
  amountPaidCents,
  defaultRefundCents,
}: {
  bookingId: string;
  reference: string;
  policyLabel: string;
  policyDescription: string;
  amountPaidCents: number;
  defaultRefundCents: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [overrideRefund, setOverrideRefund] = useState(false);
  const [refundPercent, setRefundPercent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch(`/api/admin/bookings/${bookingId}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reason,
        ...(overrideRefund && refundPercent !== "" ? { refundPercent: Number(refundPercent) } : {}),
      }),
    });
    const data = await res.json().catch(() => null);
    setLoading(false);

    if (!res.ok) {
      setError(data?.error ?? "Could not cancel this booking.");
      toast.error(data?.error ?? "Could not cancel this booking.");
      return;
    }

    const refunded = data?.refund?.refundCents ?? 0;
    toast.success(
      refunded > 0
        ? `Booking ${reference} cancelled. ${formatPrice(refunded)} refunded.`
        : `Booking ${reference} cancelled. No refund applied.`,
    );
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button type="button" variant="danger" size="sm" onClick={() => setOpen(true)}>
        Cancel &amp; refund
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} title="Cancel this booking">
        <form onSubmit={handleCancel} className="flex flex-col gap-4">
          <p className="text-sm text-stone-600">
            Cancel booking <span className="font-mono">{reference}</span> and refund the guest?
          </p>

          {amountPaidCents > 0 && (
            <div className="rounded-lg bg-surface-muted p-3 text-sm">
              <p className="font-medium text-foreground">{policyLabel} cancellation policy</p>
              <p className="mt-0.5 text-stone-600">{policyDescription}</p>
              <p className="mt-2 text-stone-700">
                Amount paid: <span className="font-medium">{formatPrice(amountPaidCents)}</span> ·
                Refund per policy: <span className="font-medium">{formatPrice(defaultRefundCents)}</span>
              </p>
            </div>
          )}

          <Field>
            <Label htmlFor="admin-cancel-reason">Reason (required, internal only)</Label>
            <Input
              id="admin-cancel-reason"
              required
              minLength={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Guest called support, host cancelled offline"
            />
          </Field>

          {amountPaidCents > 0 && (
            <Field>
              <label className="flex items-center gap-2 text-sm text-stone-700">
                <input
                  type="checkbox"
                  checked={overrideRefund}
                  onChange={(e) => setOverrideRefund(e.target.checked)}
                />
                Override the refund percentage
              </label>
              {overrideRefund && (
                <>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={refundPercent}
                    onChange={(e) => setRefundPercent(e.target.value)}
                    placeholder="0-100"
                    className="mt-2 max-w-[140px]"
                  />
                  <FieldHint>Leave unchecked to use the policy&apos;s own refund amount above.</FieldHint>
                </>
              )}
            </Field>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Never mind
            </Button>
            <Button type="submit" variant="danger" loading={loading}>
              Cancel booking
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}

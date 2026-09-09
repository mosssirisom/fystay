"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/format";

type DepositStatus = "AWAITING_AUTHORIZATION" | "AUTHORIZED" | "CAPTURED" | "RELEASED";

/**
 * Shown on a guest's own booking whenever the listing has a security
 * deposit (see securityDeposit.ts) - never rendered at all for
 * depositStatus NOT_REQUIRED. canAuthorizeNow mirrors the server's own
 * needsDepositAuthorization check exactly (computed there, passed down),
 * so the button only ever appears when the API route would actually
 * accept the request rather than reject it as too early.
 */
export function DepositStatusCard({
  bookingId,
  depositStatus,
  securityDepositCents,
  depositCapturedCents,
  canAuthorizeNow,
}: {
  bookingId: string;
  depositStatus: DepositStatus;
  securityDepositCents: number;
  depositCapturedCents: number | null;
  canAuthorizeNow: boolean;
}) {
  const [loading, setLoading] = useState(false);

  async function authorize() {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/deposit/authorize`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not start deposit authorization.");
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      toast.error("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <Card className="mt-4 flex flex-row items-start gap-3 border-brand-100 bg-brand-50 p-4">
      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" aria-hidden />
      <div className="flex-1">
        {depositStatus === "AWAITING_AUTHORIZATION" &&
          (canAuthorizeNow ? (
            <>
              <p className="font-medium text-brand-900">
                {formatPrice(securityDepositCents)} security deposit
              </p>
              <p className="text-sm text-brand-800">
                This stay requires a refundable card hold - nothing is charged now.
              </p>
              <Button size="sm" className="mt-3" onClick={authorize} loading={loading}>
                Authorize security deposit
              </Button>
            </>
          ) : (
            <>
              <p className="font-medium text-brand-900">
                {formatPrice(securityDepositCents)} security deposit
              </p>
              <p className="text-sm text-brand-800">
                A refundable card hold will be requested closer to your check-in date.
              </p>
            </>
          ))}
        {depositStatus === "AUTHORIZED" && (
          <>
            <p className="font-medium text-brand-900">
              {formatPrice(securityDepositCents)} security deposit authorized
            </p>
            <p className="text-sm text-brand-800">
              This is released automatically after your stay unless the host files a damage claim.
            </p>
          </>
        )}
        {depositStatus === "CAPTURED" && (
          <>
            <p className="font-medium text-brand-900">Security deposit claimed</p>
            <p className="text-sm text-brand-800">
              {formatPrice(depositCapturedCents ?? 0)} of your {formatPrice(securityDepositCents)} deposit
              was claimed by the host - check your email for the reason given.
            </p>
          </>
        )}
        {depositStatus === "RELEASED" && (
          <>
            <p className="font-medium text-brand-900">Security deposit released</p>
            <p className="text-sm text-brand-800">
              Your {formatPrice(securityDepositCents)} deposit hold was released - nothing was
              claimed.
            </p>
          </>
        )}
      </div>
    </Card>
  );
}

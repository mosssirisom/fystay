"use client";

import { useState } from "react";
import { toast } from "sonner";
import { BadgeCheck, ShieldAlert, ShieldQuestion } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge, type BadgeProps } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type Status = "NONE" | "PENDING" | "VERIFIED" | "FAILED";

const statusCopy: Record<Status, { label: string; variant: BadgeProps["variant"] }> = {
  NONE: { label: "Not verified", variant: "neutral" },
  PENDING: { label: "In progress", variant: "warning" },
  VERIFIED: { label: "Verified", variant: "success" },
  FAILED: { label: "Verification failed", variant: "warning" },
};

/**
 * Real government-ID + selfie verification via Stripe Identity - see
 * src/lib/identity.ts. `configured` is Stripe being set up at all
 * (getStripeClient() on the server), not anything about this specific
 * user - without it there's no button, only an explanation, the same
 * "plumbing, inactive without key" treatment as phone verification below.
 */
export function IdentityVerificationCard({
  status,
  configured,
}: {
  status: Status;
  configured: boolean;
}) {
  const [loading, setLoading] = useState(false);

  async function startVerification() {
    setLoading(true);
    try {
      const res = await fetch("/api/account/identity/start", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not start identity verification.");
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
    <Card className="p-5">
      <CardHeader className="flex-row items-center justify-between gap-3 p-0">
        <CardTitle className="flex items-center gap-2">
          {status === "VERIFIED" ? (
            <BadgeCheck className="h-4.5 w-4.5 text-brand-600" aria-hidden />
          ) : status === "FAILED" ? (
            <ShieldAlert className="h-4.5 w-4.5 text-amber-500" aria-hidden />
          ) : (
            <ShieldQuestion className="h-4.5 w-4.5 text-stone-400" aria-hidden />
          )}
          Identity verification
        </CardTitle>
        <Badge variant={statusCopy[status].variant}>{statusCopy[status].label}</Badge>
      </CardHeader>
      <CardContent className="mt-3 flex flex-col gap-3 p-0 text-sm text-stone-600">
        {status === "VERIFIED" ? (
          // A past verification stays true regardless of whether Stripe
          // happens to be configured in this environment right now - only
          // starting a NEW verification needs `configured`.
          <p>Your government ID has been verified. This shows other guests and hosts you&apos;re a real, verified person.</p>
        ) : !configured ? (
          <p>Identity verification isn&apos;t available right now.</p>
        ) : (
          <>
            <p>
              Verify your identity with a government ID and a selfie, handled securely by Stripe -
              FYStay never sees or stores your ID.
            </p>
            {status === "FAILED" && (
              <p className="text-amber-700">
                Your last attempt didn&apos;t go through. You can try again below.
              </p>
            )}
            <Button onClick={startVerification} loading={loading} className="self-start">
              {status === "PENDING" ? "Continue verification" : "Verify your identity"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

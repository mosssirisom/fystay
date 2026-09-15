"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { signOutAction } from "@/actions/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/Dialog";

/**
 * Signs this account out everywhere at once - any other browser, tab, or
 * device with a live session, not just the one used to press the button
 * (which is itself signed out immediately after, since the same bump
 * invalidates it too). See POST /api/account/sign-out-everywhere and
 * src/lib/sessionRevocation.ts for how that's actually enforced server-side
 * rather than just being a client-side cookie clear.
 */
export function SecuritySessionsCard() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSignOutEverywhere() {
    setLoading(true);
    const res = await fetch("/api/account/sign-out-everywhere", { method: "POST" });
    if (!res.ok) {
      setLoading(false);
      setConfirmOpen(false);
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? "Couldn't sign out of your other sessions.");
      return;
    }
    await signOutAction();
  }

  return (
    <Card className="p-5">
      <CardHeader className="p-0">
        <CardTitle>Security</CardTitle>
      </CardHeader>
      <CardContent className="mt-3 p-0">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Sign out of all devices</p>
            <p className="mt-0.5 text-sm text-stone-500">
              Ends every session for this account, including this one - anywhere else you&rsquo;re
              signed in will need to log back in.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmOpen(true)}
            className="self-start sm:self-auto"
          >
            <LogOut className="h-4 w-4" />
            Sign out everywhere
          </Button>
        </div>
      </CardContent>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleSignOutEverywhere}
        title="Sign out of all devices?"
        description="You'll be signed out here too, and will need to log back in on every device."
        confirmLabel="Sign out everywhere"
        loading={loading}
      />
    </Card>
  );
}

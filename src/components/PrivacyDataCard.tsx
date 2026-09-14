"use client";

import { useState } from "react";
import { Download, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { signOutAction } from "@/actions/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button, buttonVariants } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { cn } from "@/lib/cn";

const BLOCK_MESSAGES: Record<string, string> = {
  upcoming_bookings_as_guest: "You have an upcoming or in-progress booking - cancel it first.",
  listings_still_exist: "You still have listings - delete them first.",
  stripe_connect_active: "Your Stripe payouts account is still active - contact us to close it before deleting your account.",
};

export function PrivacyDataCard() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch("/api/account", { method: "DELETE" });
    const data = await res.json();
    setDeleting(false);

    if (!res.ok) {
      setConfirmOpen(false);
      const blocks: string[] = data.blocks ?? [];
      if (blocks.length > 0) {
        blocks.forEach((block) => toast.error(BLOCK_MESSAGES[block] ?? "Couldn't delete your account."));
      } else {
        toast.error(data.error ?? "Couldn't delete your account.");
      }
      return;
    }

    toast.success("Your account has been deleted");
    await signOutAction();
  }

  return (
    <Card className="p-5">
      <CardHeader className="p-0">
        <CardTitle>Privacy &amp; data</CardTitle>
      </CardHeader>
      <CardContent className="mt-3 flex flex-col gap-5 p-0">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Download your data</p>
            <p className="mt-0.5 text-sm text-stone-500">
              A copy of your profile, bookings, reviews and messages as a JSON file.
            </p>
          </div>
          <a
            href="/api/account/export"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "self-start sm:self-auto")}
          >
            <Download className="h-4 w-4" />
            Download
          </a>
        </div>

        <div className="flex flex-col gap-2 border-t border-border-subtle pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Delete your account</p>
            <p className="mt-0.5 text-sm text-stone-500">
              Permanently removes your personal details. Past bookings and reviews stay on record
              for other guests/hosts and for our own financial records, but are no longer linked to
              your name.
            </p>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setConfirmOpen(true)}
            className="self-start sm:self-auto"
          >
            <ShieldAlert className="h-4 w-4" />
            Delete account
          </Button>
        </div>
      </CardContent>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete your account?"
        description="This can't be undone. Your name, email and phone number are removed everywhere; you'll be signed out immediately."
        confirmLabel="Delete my account"
        loading={deleting}
        danger
      />
    </Card>
  );
}

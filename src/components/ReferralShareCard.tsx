"use client";

import { toast } from "sonner";
import { Copy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Field, Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function ReferralShareCard({
  referralCode,
  referralLink,
}: {
  referralCode: string;
  referralLink: string;
}) {
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(referralLink);
      toast.success("Invite link copied");
    } catch {
      toast.error("Couldn't copy - select and copy the link manually");
    }
  }

  return (
    <Card className="mt-6 p-5">
      <CardContent className="flex flex-col gap-5 p-0">
        <Field>
          <Label htmlFor="referralLink">Your invite link</Label>
          <div className="flex gap-2">
            <Input
              id="referralLink"
              readOnly
              value={referralLink}
              onFocus={(e) => e.currentTarget.select()}
              className="text-xs text-zinc-500"
            />
            <Button type="button" variant="outline" onClick={copyLink}>
              <Copy className="h-4 w-4" />
              Copy
            </Button>
          </div>
        </Field>

        <div className="flex items-center gap-3 border-t border-border-subtle pt-4">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Or share your code
          </span>
          <span className="rounded-lg bg-surface-muted px-3 py-1 font-mono text-sm font-semibold tracking-widest text-foreground">
            {referralCode}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

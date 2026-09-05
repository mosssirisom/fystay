"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/Dialog";
import { Textarea } from "@/components/ui/Textarea";
import { Button, buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

/**
 * The listing page's entry point into messaging (see /inbox) - a guest's
 * first message to a host, before or instead of booking. Follows the same
 * logged-out-prompt pattern as SaveButton: never a surprise redirect, an
 * explicit dialog explaining why signing in is needed first.
 */
export function ContactHostButton({
  listingId,
  hostName,
  isLoggedIn,
}: {
  listingId: string;
  hostName: string;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const callbackUrl = pathname || "/";

  async function handleSend() {
    const trimmed = body.trim();
    if (!trimmed || sending) return;
    setSending(true);

    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, body: trimmed }),
    });
    setSending(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? "Could not send that message.");
      return;
    }

    const data = await res.json();
    setOpen(false);
    setBody("");
    router.push(`/inbox/${data.conversationId}`);
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className="w-full sm:w-auto">
        <MessageCircle className="h-4 w-4" />
        Message host
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={isLoggedIn ? `Message ${hostName}` : "Sign in to message the host"}
      >
        {isLoggedIn ? (
          <div className="flex flex-col gap-3">
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={`Ask ${hostName} a question about this place…`}
              rows={4}
              maxLength={4000}
              autoFocus
            />
            <Button onClick={handleSend} loading={sending} disabled={!body.trim()} className="self-end">
              Send
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-zinc-600">
              Sign in or create a free account to ask {hostName} a question about this place.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Link
                href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}
                onClick={() => setOpen(false)}
                className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}
              >
                Create account
              </Link>
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
                onClick={() => setOpen(false)}
                className={cn(buttonVariants(), "w-full sm:w-auto")}
              >
                Log in
              </Link>
            </div>
          </div>
        )}
      </Dialog>
    </>
  );
}

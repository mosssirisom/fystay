"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

/** A reply box for an existing conversation - refreshes the page's own server-fetched messages on success, rather than maintaining a separate client-side copy of the thread. */
export function MessageComposer({ conversationId }: { conversationId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSend() {
    const trimmed = body.trim();
    if (!trimmed || sending) return;
    setSending(true);

    const res = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: trimmed }),
    });
    setSending(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? "Could not send that message.");
      return;
    }

    setBody("");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleSend();
          }
        }}
        placeholder="Write a message…"
        rows={2}
        maxLength={4000}
      />
      <Button
        onClick={handleSend}
        loading={sending}
        disabled={!body.trim()}
        className="self-end"
      >
        Send
      </Button>
    </div>
  );
}

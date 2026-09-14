"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

/** Opens a new support ticket, then takes the user straight to its thread - the same "create, then go to the thing you created" flow MessageComposer's own conversation-starting equivalent uses. */
export function NewSupportTicketForm() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedSubject = subject.trim();
    const trimmedBody = body.trim();
    if (!trimmedSubject || !trimmedBody || sending) return;
    setSending(true);

    const res = await fetch("/api/support-tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject: trimmedSubject, body: trimmedBody }),
    });
    const data = await res.json().catch(() => null);
    setSending(false);

    if (!res.ok) {
      toast.error(data?.error ?? "Could not open that ticket.");
      return;
    }

    toast.success("Support ticket opened");
    router.push(`/help/tickets/${data.ticket.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="ticket-subject" className="mb-1.5 block text-sm font-medium text-foreground">
          Subject
        </label>
        <Input
          id="ticket-subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Briefly, what's this about?"
          maxLength={200}
          required
        />
      </div>
      <div>
        <label htmlFor="ticket-body" className="mb-1.5 block text-sm font-medium text-foreground">
          Message
        </label>
        <Textarea
          id="ticket-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Describe the issue - include a booking reference if it's relevant."
          rows={6}
          maxLength={4000}
          required
        />
      </div>
      <Button type="submit" loading={sending} disabled={!subject.trim() || !body.trim()} className="self-end">
        Open ticket
      </Button>
    </form>
  );
}

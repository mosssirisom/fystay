"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import type { SupportTicketStatus } from "@prisma/client";

const STATUS_OPTIONS: { value: SupportTicketStatus; label: string }[] = [
  { value: "OPEN", label: "Open" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
];

/**
 * The admin side of a ticket: a reply box (always sets isAdminReply: true,
 * and never reopens a resolved/closed ticket on its own - see
 * nextStatusAfterMessage) and status buttons, side by side since resolving
 * a ticket with a closing note is the common case and shouldn't take two
 * separate page interactions.
 */
export function AdminTicketPanel({ ticketId, status }: { ticketId: string; status: SupportTicketStatus }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<SupportTicketStatus | null>(null);

  async function handleSend() {
    const trimmed = body.trim();
    if (!trimmed || sending) return;
    setSending(true);

    const res = await fetch(`/api/admin/support-tickets/${ticketId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: trimmed }),
    });
    setSending(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? "Could not send that reply.");
      return;
    }

    setBody("");
    router.refresh();
  }

  async function handleStatusChange(newStatus: SupportTicketStatus) {
    if (newStatus === status || updatingStatus) return;
    setUpdatingStatus(newStatus);

    const res = await fetch(`/api/admin/support-tickets/${ticketId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const data = await res.json().catch(() => null);
    setUpdatingStatus(null);

    if (!res.ok) {
      toast.error(data?.error ?? "Could not update the status.");
      return;
    }
    toast.success(`Ticket marked ${newStatus.toLowerCase()}`);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-foreground">Status:</span>
        {STATUS_OPTIONS.map((option) => (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant={option.value === status ? "primary" : "outline"}
            loading={updatingStatus === option.value}
            disabled={option.value === status}
            onClick={() => handleStatusChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

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
          placeholder="Reply as FYStay support…"
          rows={3}
          maxLength={4000}
        />
        <Button onClick={handleSend} loading={sending} disabled={!body.trim()} className="self-end">
          Send reply
        </Button>
      </div>
    </div>
  );
}

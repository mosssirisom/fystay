"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

const REASONS = [
  { value: "spam", label: "Spam or advertising" },
  { value: "offensive", label: "Offensive content" },
  { value: "not_genuine", label: "Doesn't seem genuine" },
  { value: "other", label: "Something else" },
];

export function ReportReviewButton({
  reviewId,
  alreadyReported,
}: {
  reviewId: string;
  alreadyReported: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0].value);
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [reported, setReported] = useState(alreadyReported);

  if (reported) {
    return <span className="shrink-0 text-xs text-zinc-400">Reported</span>;
  }

  async function handleSubmit() {
    setLoading(true);
    const res = await fetch(`/api/reviews/${reviewId}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason, details: details.trim() || undefined }),
    });
    setLoading(false);

    if (res.ok) {
      toast.success("Thanks, we'll take a look.");
      setReported(true);
      setOpen(false);
    } else {
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? "Could not submit report.");
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="focus-ring flex shrink-0 items-center gap-1 rounded-lg px-1.5 py-1 text-xs text-zinc-400 hover:bg-surface-muted hover:text-zinc-600"
      >
        <Flag className="h-3.5 w-3.5" />
        Report
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} title="Report this review">
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-1.5 text-xs font-semibold text-foreground">Reason</p>
            <Select value={reason} onChange={(e) => setReason(e.target.value)}>
              {REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </Select>
          </div>
          <Textarea
            rows={3}
            maxLength={1000}
            placeholder="Any extra detail (optional)"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleSubmit} loading={loading}>
              Submit report
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}

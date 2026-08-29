"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";

export function HostReviewResponseForm({
  reviewId,
  initialResponse,
}: {
  reviewId: string;
  initialResponse: string | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(!initialResponse);
  const [response, setResponse] = useState(initialResponse ?? "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!response.trim()) {
      toast.error("Write a response first.");
      return;
    }

    setLoading(true);
    const res = await fetch(`/api/reviews/${reviewId}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ response: response.trim() }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? "Could not submit response.");
      return;
    }

    toast.success("Response published");
    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <div className="mt-2 flex flex-col gap-1.5 rounded-lg bg-surface-muted p-3 text-sm">
        <p className="font-medium text-foreground">Your response</p>
        <p className="text-zinc-600">{response}</p>
        <button
          onClick={() => setEditing(true)}
          className="focus-ring self-start rounded-lg text-xs font-medium text-zinc-600 underline-offset-2 hover:underline"
        >
          Edit response
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-2">
      <Textarea
        rows={3}
        maxLength={2000}
        placeholder="Write a public response to this review..."
        value={response}
        onChange={(e) => setResponse(e.target.value)}
      />
      <div className="flex justify-end gap-2">
        {initialResponse && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setEditing(false);
              setResponse(initialResponse);
            }}
            disabled={loading}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" size="sm" loading={loading}>
          {initialResponse ? "Save response" : "Post response"}
        </Button>
      </div>
    </form>
  );
}

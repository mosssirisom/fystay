"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Copy, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Field, FieldHint, Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function IcalSync({
  listingId,
  exportUrl,
  initialImportUrl,
  syncedAt,
}: {
  listingId: string;
  exportUrl: string;
  initialImportUrl: string | null;
  syncedAt: Date | null;
}) {
  const router = useRouter();
  const [importUrl, setImportUrl] = useState(initialImportUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  async function handleCopyExportUrl() {
    try {
      await navigator.clipboard.writeText(exportUrl);
      toast.success("Calendar link copied");
    } catch {
      toast.error("Couldn't copy - select and copy the link manually");
    }
  }

  async function handleSyncNow() {
    setSyncing(true);
    const res = await fetch(`/api/listings/${listingId}/ical-sync`, { method: "POST" });
    const data = await res.json();
    setSyncing(false);

    if (!res.ok) {
      toast.error(data.error ?? "Could not sync that calendar.");
      return;
    }
    toast.success(
      data.result
        ? `Synced - ${data.result.synced} date${data.result.synced === 1 ? "" : "s"} updated`
        : "Synced",
    );
    router.refresh();
  }

  async function handleSaveImportUrl() {
    setSaving(true);
    const res = await fetch(`/api/listings/${listingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ icalImportUrl: importUrl.trim() || null }),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      toast.error(data.error ?? "Could not save that calendar URL.");
      return;
    }

    if (importUrl.trim()) {
      toast.success("Calendar URL saved - syncing now");
      router.refresh();
      await handleSyncNow();
    } else {
      toast.success("Calendar import removed");
      router.refresh();
    }
  }

  return (
    <Card className="p-5">
      <CardHeader className="p-0">
        <CardTitle>Calendar sync</CardTitle>
      </CardHeader>
      <CardContent className="mt-3 flex flex-col gap-5 p-0">
        <Field>
          <Label htmlFor="icalExportUrl">Export this calendar</Label>
          <div className="flex gap-2">
            <Input
              id="icalExportUrl"
              readOnly
              value={exportUrl}
              onFocus={(e) => e.currentTarget.select()}
              className="text-xs text-zinc-500"
            />
            <Button type="button" variant="outline" onClick={handleCopyExportUrl}>
              <Copy className="h-4 w-4" />
              Copy
            </Button>
          </div>
          <FieldHint>
            Add this link to Airbnb, Vrbo, or Google Calendar so your FYStay bookings show as
            unavailable there too.
          </FieldHint>
        </Field>

        <Field>
          <Label htmlFor="icalImportUrl">Import an external calendar</Label>
          <div className="flex gap-2">
            <Input
              id="icalImportUrl"
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              placeholder="https://www.airbnb.com/calendar/ical/....ics"
            />
            <Button type="button" onClick={handleSaveImportUrl} loading={saving}>
              Save
            </Button>
          </div>
          <FieldHint>
            Paste your Airbnb/Vrbo calendar export link so bookings made elsewhere block those
            dates here too, avoiding a double booking.
          </FieldHint>
          {initialImportUrl && (
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-zinc-500">
                {syncedAt
                  ? `Last synced ${formatDistanceToNow(syncedAt, { addSuffix: true })}`
                  : "Not yet synced"}
              </span>
              <button
                type="button"
                onClick={handleSyncNow}
                disabled={syncing}
                className="focus-ring flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-surface-muted disabled:pointer-events-none disabled:opacity-50"
              >
                <RefreshCw className={syncing ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
                Sync now
              </button>
            </div>
          )}
        </Field>
      </CardContent>
    </Card>
  );
}

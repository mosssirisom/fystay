"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/Dialog";
import { Field, FieldHint, Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

const CATEGORY_LABELS = {
  AIRPORT_TRANSFER: "Airport transfer",
  ATTRACTION_TICKET: "Attraction ticket",
  CAR_HIRE: "Car hire",
} as const;

export type EditableProvider = {
  id: string;
  name: string;
  category: keyof typeof CATEGORY_LABELS;
  notificationEmail: string;
  bookingFormUrl: string | null;
};

/**
 * The only way to fix a provider's name/category/email/booking-page URL
 * after creation was previously deactivate-and-recreate (losing its
 * offerings' history along the way) - the PATCH route already accepted all
 * of these fields (see src/app/api/admin/extras/providers/[id]/route.ts's
 * own comment on why they're all safely editable), this just gives admins
 * a form for it.
 */
export function EditExtraProviderDialog({ provider }: { provider: EditableProvider }) {
  const router = useRouter();
  // Every provider row renders its own instance of this dialog (mounted,
  // just hidden, not lazily created on open) - a hardcoded id here would
  // collide across rows since <label htmlFor> and Playwright/assistive-tech
  // lookups both resolve by literal id, not by which dialog happens to be
  // visually open.
  const idPrefix = useId();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState({
    name: provider.name,
    category: provider.category,
    notificationEmail: provider.notificationEmail,
    bookingFormUrl: provider.bookingFormUrl ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function openDialog() {
    setValues({
      name: provider.name,
      category: provider.category,
      notificationEmail: provider.notificationEmail,
      bookingFormUrl: provider.bookingFormUrl ?? "",
    });
    setError(null);
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch(`/api/admin/extras/providers/${provider.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: values.name,
        category: values.category,
        notificationEmail: values.notificationEmail,
        bookingFormUrl: values.bookingFormUrl.trim() || null,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Could not save this provider.");
      return;
    }

    toast.success(`${data.provider.name} updated`);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={openDialog}>
        Edit
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Edit provider">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field>
            <Label htmlFor={`${idPrefix}-name`}>Business name</Label>
            <Input
              id={`${idPrefix}-name`}
              required
              value={values.name}
              onChange={(e) => update("name", e.target.value)}
            />
          </Field>
          <Field>
            <Label htmlFor={`${idPrefix}-category`}>Category</Label>
            <Select
              id={`${idPrefix}-category`}
              value={values.category}
              onChange={(e) => update("category", e.target.value as typeof values.category)}
            >
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field>
            <Label htmlFor={`${idPrefix}-email`}>Notification email</Label>
            <Input
              id={`${idPrefix}-email`}
              required
              type="email"
              value={values.notificationEmail}
              onChange={(e) => update("notificationEmail", e.target.value)}
            />
            <FieldHint>Every paid booking request is emailed here.</FieldHint>
          </Field>
          <Field>
            <Label htmlFor={`${idPrefix}-bookingFormUrl`}>Their own booking page (optional)</Label>
            <Input
              id={`${idPrefix}-bookingFormUrl`}
              type="url"
              value={values.bookingFormUrl}
              onChange={(e) => update("bookingFormUrl", e.target.value)}
              placeholder="https://provider.com/book"
            />
          </Field>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Save changes
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}

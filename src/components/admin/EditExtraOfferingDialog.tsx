"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/Dialog";
import { Field, FieldHint, Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

export type EditableOffering = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  features: string[];
};

/**
 * Fixing an offering's name/description/price/marketing bullets previously
 * meant deactivating it and creating a fresh one (which drops it out of
 * every guest-facing surface's "already purchased" history it's linked
 * to via BookingExtra). The PATCH route already supports editing all of
 * these in place (see its own comment on why providerId/category aren't
 * included), this just gives admins a form for it.
 */
export function EditExtraOfferingDialog({ offering }: { offering: EditableOffering }) {
  const router = useRouter();
  // Every offering row renders its own instance of this dialog (mounted,
  // just hidden) - see EditExtraProviderDialog's own comment on why a
  // hardcoded id here would collide across rows.
  const idPrefix = useId();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState({
    name: offering.name,
    description: offering.description ?? "",
    priceCents: (offering.priceCents / 100).toString(),
    features: offering.features.join(", "),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function openDialog() {
    setValues({
      name: offering.name,
      description: offering.description ?? "",
      priceCents: (offering.priceCents / 100).toString(),
      features: offering.features.join(", "),
    });
    setError(null);
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch(`/api/admin/extras/offerings/${offering.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: values.name,
        description: values.description.trim() || null,
        priceCents: Math.round(Number(values.priceCents) * 100),
        features: values.features
          .split(",")
          .map((feature) => feature.trim())
          .filter(Boolean),
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Could not save this offering.");
      return;
    }

    toast.success(`${data.offering.name} updated`);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={openDialog}>
        Edit
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Edit offering">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field>
            <Label htmlFor={`${idPrefix}-name`}>Name</Label>
            <Input
              id={`${idPrefix}-name`}
              required
              value={values.name}
              onChange={(e) => update("name", e.target.value)}
            />
          </Field>
          <Field>
            <Label htmlFor={`${idPrefix}-description`}>Description (optional)</Label>
            <Textarea
              id={`${idPrefix}-description`}
              rows={2}
              value={values.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </Field>
          <Field className="max-w-xs">
            <Label htmlFor={`${idPrefix}-price`}>Price (£)</Label>
            <Input
              id={`${idPrefix}-price`}
              required
              type="number"
              min={0.01}
              step={0.01}
              value={values.priceCents}
              onChange={(e) => update("priceCents", e.target.value)}
            />
            <FieldHint>Only affects future purchases - past ones keep their own price.</FieldHint>
          </Field>
          <Field>
            <Label htmlFor={`${idPrefix}-features`}>Marketing bullets (optional)</Label>
            <Input
              id={`${idPrefix}-features`}
              value={values.features}
              onChange={(e) => update("features", e.target.value)}
              placeholder="Tesla / fully electric, Fixed pricing, Meet & greet"
            />
            <FieldHint>Comma-separated.</FieldHint>
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

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Ticket } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Field, FieldHint, Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/SectionHeading";

const CATEGORY_LABELS = {
  AIRPORT_TRANSFER: "Airport transfer",
  ATTRACTION_TICKET: "Attraction ticket",
  CAR_HIRE: "Car hire",
} as const;

export type ExtraProviderOption = {
  id: string;
  name: string;
  category: keyof typeof CATEGORY_LABELS;
};

function emptyForm(providers: ExtraProviderOption[]) {
  return {
    providerId: providers[0]?.id ?? "",
    name: "",
    description: "",
    priceCents: "",
  };
}

/**
 * Creates one bookable ExtraOffering under an existing provider. Requires
 * at least one provider to exist first - see the empty-state message on
 * /admin/extras if there isn't one yet.
 */
export function ExtraOfferingForm({ providers }: { providers: ExtraProviderOption[] }) {
  const router = useRouter();
  const [values, setValues] = useState(() => emptyForm(providers));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof ReturnType<typeof emptyForm>>(
    key: K,
    value: ReturnType<typeof emptyForm>[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  const selectedProvider = providers.find((p) => p.id === values.providerId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!selectedProvider) {
      setError("Add a provider first.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/admin/extras/offerings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        providerId: values.providerId,
        name: values.name,
        description: values.description.trim() || undefined,
        category: selectedProvider.category,
        priceCents: Math.round(Number(values.priceCents) * 100),
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Could not create offering.");
      toast.error(data.error ?? "Could not create offering.");
      return;
    }

    toast.success(`${data.offering.name} added`);
    setValues(emptyForm(providers));
    router.refresh();
  }

  if (providers.length === 0) {
    return (
      <Card>
        <CardContent className="p-5 text-sm text-stone-500">
          Add a provider above before creating an offering for them.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <SectionHeading icon={Ticket}>Add an offering</SectionHeading>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
              <Label htmlFor="offeringProvider">Provider</Label>
              <Select
                id="offeringProvider"
                value={values.providerId}
                onChange={(e) => update("providerId", e.target.value)}
              >
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name} ({CATEGORY_LABELS[provider.category]})
                  </option>
                ))}
              </Select>
            </Field>
            <Field>
              <Label htmlFor="offeringName">Name</Label>
              <Input
                id="offeringName"
                required
                value={values.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="Return airport transfer"
              />
            </Field>
          </div>

          <Field>
            <Label htmlFor="offeringDescription">Description (optional)</Label>
            <Textarea
              id="offeringDescription"
              rows={2}
              value={values.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Shown to the guest under the offering's name."
            />
          </Field>

          <Field className="max-w-xs">
            <Label htmlFor="offeringPrice">Price (£)</Label>
            <Input
              id="offeringPrice"
              required
              type="number"
              min={0.01}
              step={0.01}
              value={values.priceCents}
              onChange={(e) => update("priceCents", e.target.value)}
            />
            <FieldHint>What FYStay charges the guest - see the roadmap doc&apos;s payment model.</FieldHint>
          </Field>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" loading={loading} className="self-start">
            Add offering
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

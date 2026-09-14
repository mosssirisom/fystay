"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Field, FieldHint, Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/SectionHeading";

const CATEGORY_LABELS = {
  AIRPORT_TRANSFER: "Airport transfer",
  ATTRACTION_TICKET: "Attraction ticket",
  CAR_HIRE: "Car hire",
} as const;

const emptyForm = {
  name: "",
  category: "AIRPORT_TRANSFER" as keyof typeof CATEGORY_LABELS,
  notificationEmail: "",
  bookingFormUrl: "",
};

/**
 * Creates a Trip Extras provider (see docs/trip-extras-roadmap.md) - a
 * business FYStay resells add-ons for. Onboarding a new provider (Phase 2
 * of the roadmap - broadening past EV Exec) no longer requires hand-
 * editing prisma/seed.ts.
 */
export function ExtraProviderForm() {
  const router = useRouter();
  const [values, setValues] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/admin/extras/providers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: values.name,
        category: values.category,
        notificationEmail: values.notificationEmail,
        bookingFormUrl: values.bookingFormUrl.trim() || undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Could not create provider.");
      toast.error(data.error ?? "Could not create provider.");
      return;
    }

    toast.success(`${data.provider.name} added`);
    setValues(emptyForm);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <SectionHeading icon={Building2}>Add a provider</SectionHeading>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
              <Label htmlFor="providerName">Business name</Label>
              <Input
                id="providerName"
                required
                value={values.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="EV Exec"
              />
            </Field>
            <Field>
              <Label htmlFor="providerCategory">Category</Label>
              <Select
                id="providerCategory"
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
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
              <Label htmlFor="providerEmail">Notification email</Label>
              <Input
                id="providerEmail"
                required
                type="email"
                value={values.notificationEmail}
                onChange={(e) => update("notificationEmail", e.target.value)}
                placeholder="bookings@provider.com"
              />
              <FieldHint>Every paid booking request is emailed here (see the roadmap doc).</FieldHint>
            </Field>
            <Field>
              <Label htmlFor="providerBookingFormUrl">Their own booking page (optional)</Label>
              <Input
                id="providerBookingFormUrl"
                type="url"
                value={values.bookingFormUrl}
                onChange={(e) => update("bookingFormUrl", e.target.value)}
                placeholder="https://provider.com/book"
              />
            </Field>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" loading={loading} className="self-start">
            Add provider
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

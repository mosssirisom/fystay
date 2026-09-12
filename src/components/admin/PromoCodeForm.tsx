"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Ticket } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Field, FieldHint, Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/SectionHeading";

type DiscountType = "PERCENT" | "FIXED";

const emptyForm = {
  code: "",
  description: "",
  discountType: "PERCENT" as DiscountType,
  discountValue: "",
  maxRedemptions: "",
  expiresAt: "",
};

export function PromoCodeForm() {
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

    const payload = {
      code: values.code,
      description: values.description.trim() || undefined,
      discountType: values.discountType,
      discountValue:
        values.discountType === "PERCENT"
          ? Number(values.discountValue)
          : Math.round(Number(values.discountValue) * 100),
      maxRedemptions: values.maxRedemptions ? Number(values.maxRedemptions) : undefined,
      expiresAt: values.expiresAt ? new Date(values.expiresAt).toISOString() : undefined,
    };

    const res = await fetch("/api/admin/promo-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Could not create promo code.");
      toast.error(data.error ?? "Could not create promo code.");
      return;
    }

    toast.success(`Promo code ${data.promoCode.code} created`);
    setValues(emptyForm);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <SectionHeading icon={Ticket}>Create a promo code</SectionHeading>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                required
                value={values.code}
                onChange={(e) => update("code", e.target.value)}
                placeholder="WELCOME10"
                className="uppercase"
              />
              <FieldHint>Guests type this at checkout - not case sensitive.</FieldHint>
            </Field>
            <Field>
              <Label htmlFor="description">Description (optional, internal only)</Label>
              <Input
                id="description"
                value={values.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Launch week promo"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field>
              <Label htmlFor="discountType">Discount type</Label>
              <Select
                id="discountType"
                value={values.discountType}
                onChange={(e) => update("discountType", e.target.value as DiscountType)}
              >
                <option value="PERCENT">Percentage</option>
                <option value="FIXED">Fixed amount</option>
              </Select>
            </Field>
            <Field>
              <Label htmlFor="discountValue">
                {values.discountType === "PERCENT" ? "Percent off" : "Amount off (£)"}
              </Label>
              <Input
                id="discountValue"
                required
                type="number"
                min={1}
                max={values.discountType === "PERCENT" ? 100 : undefined}
                step={values.discountType === "PERCENT" ? 1 : 0.01}
                value={values.discountValue}
                onChange={(e) => update("discountValue", e.target.value)}
              />
            </Field>
            <Field>
              <Label htmlFor="maxRedemptions">Max redemptions (optional)</Label>
              <Input
                id="maxRedemptions"
                type="number"
                min={1}
                value={values.maxRedemptions}
                onChange={(e) => update("maxRedemptions", e.target.value)}
                placeholder="Unlimited"
              />
            </Field>
            <Field>
              <Label htmlFor="expiresAt">Expires (optional)</Label>
              <Input
                id="expiresAt"
                type="date"
                value={values.expiresAt}
                onChange={(e) => update("expiresAt", e.target.value)}
              />
            </Field>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" loading={loading} className="self-start">
            Create promo code
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

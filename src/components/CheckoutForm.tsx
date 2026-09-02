"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Field, FieldError, Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/format";

export function CheckoutForm({
  bookingId,
  defaultName,
  defaultEmail,
  defaultPhone,
  guests,
  totalPriceCents,
}: {
  bookingId: string;
  defaultName: string;
  defaultEmail: string;
  defaultPhone: string;
  guests: number;
  totalPriceCents: number;
}) {
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [phone, setPhone] = useState(defaultPhone);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError("Please fill in your name, email, and phone number.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          guestName: name.trim(),
          guestEmail: email.trim(),
          guestPhone: phone.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Could not start checkout.");
        toast.error(data.error ?? "Could not start checkout.");
        setLoading(false);
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("Something went wrong. Please try again.");
      toast.error("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Card>
        <CardHeader>
          <CardTitle>Confirm your details</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <Label htmlFor="guestName">Full name</Label>
            <Input
              id="guestName"
              autoComplete="name"
              required
              invalid={Boolean(error)}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field>
            <Label htmlFor="guestEmail">Email</Label>
            <Input
              id="guestEmail"
              type="email"
              autoComplete="email"
              required
              invalid={Boolean(error)}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field>
            <Label htmlFor="guestPhone">Phone number</Label>
            <Input
              id="guestPhone"
              type="tel"
              autoComplete="tel"
              required
              invalid={Boolean(error)}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="For your host to reach you about the stay"
            />
            <FieldError>{error}</FieldError>
          </Field>
          <div className="flex items-center justify-between rounded-lg bg-surface-muted px-3 py-2 text-sm">
            <span className="text-zinc-600">Guests</span>
            <span className="font-medium text-foreground">
              {guests} guest{guests === 1 ? "" : "s"}
            </span>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" loading={loading} size="lg" className="mt-6 hidden w-full lg:flex">
        Pay securely {formatPrice(totalPriceCents)}
      </Button>
      <p className="mt-3 hidden items-center justify-center gap-1.5 text-center text-xs text-zinc-500 lg:flex">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
        You&apos;ll pay on Stripe&apos;s secure checkout page. FYStay never sees or stores your
        card details.
      </p>

      <div className="fixed inset-x-0 bottom-0 z-10 flex items-center justify-between gap-4 border-t border-border-subtle bg-surface px-4 py-3 [padding-bottom:calc(env(safe-area-inset-bottom)+0.75rem)] lg:hidden">
        <div>
          <p className="text-xs text-zinc-500">Total</p>
          <p className="text-base font-semibold text-foreground">{formatPrice(totalPriceCents)}</p>
        </div>
        <Button type="submit" loading={loading} size="lg" className="flex-1">
          Pay securely
        </Button>
      </div>
    </form>
  );
}

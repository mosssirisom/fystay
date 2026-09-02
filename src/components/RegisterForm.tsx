"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Home, Luggage } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Card, CardContent } from "@/components/ui/Card";
import { Field, FieldError, Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

const roleOptions = [
  { value: "GUEST" as const, label: "Book stays", icon: Luggage },
  { value: "HOST" as const, label: "Host my place", icon: Home },
];

function RegisterFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Preselects "Host my place" when arriving from the /host landing page's
  // "List your property" CTA (?role=host), so a visitor who already read
  // the host pitch doesn't have to make the same choice twice.
  const [role, setRole] = useState<"GUEST" | "HOST">(() =>
    searchParams.get("role")?.toUpperCase() === "HOST" ? "HOST" : "GUEST",
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong.");
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      router.push(callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/login");
      return;
    }

    router.push(callbackUrl ?? (role === "HOST" ? "/host/dashboard" : "/"));
    router.refresh();
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-16">
      <div className="mb-8 flex flex-col items-center text-center">
        <Logo size="lg" className="mb-3" />
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="mt-1 text-sm text-zinc-500">Join fystay in a few seconds</p>
      </div>

      <Card>
        <CardContent className="pt-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <fieldset>
              <legend className="mb-1.5 text-sm font-medium text-zinc-800">I want to</legend>
              <div className="grid grid-cols-2 gap-2">
                {roleOptions.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRole(value)}
                    aria-pressed={role === value}
                    className={cn(
                      "focus-ring flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-sm font-medium transition-colors",
                      role === value
                        ? "border-brand-600 bg-brand-50 text-brand-800"
                        : "border-border-subtle text-zinc-600 hover:bg-surface-muted",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>

            <Field>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <Field>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                invalid={Boolean(error)}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <FieldError>{error}</FieldError>
            </Field>

            <Button type="submit" loading={loading} className="mt-2 w-full">
              Sign up
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="mt-6 text-center text-sm text-zinc-600">
        Already have an account?{" "}
        <Link
          href={callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/login"}
          className="font-medium text-brand-700 hover:underline"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}

export function RegisterForm() {
  return (
    <Suspense>
      <RegisterFormInner />
    </Suspense>
  );
}

"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Logo } from "@/components/Logo";
import { SITE_NAME } from "@/lib/seo";
import { Card, CardContent } from "@/components/ui/Card";
import { Field, FieldError, Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

function LoginFormInner({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("That email and password don't match an account.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-16">
      <div className="mb-8 flex flex-col items-center text-center">
        <Logo size="lg" className="mb-3" />
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="mt-1 text-sm text-zinc-500">Log in to continue to {SITE_NAME}</p>
      </div>

      <Card>
        <CardContent className="pt-5">
          {googleEnabled && (
            <>
              <GoogleSignInButton callbackUrl={callbackUrl} />
              <div className="my-4 flex items-center gap-3 text-xs text-zinc-400">
                <span className="h-px flex-1 bg-border-subtle" />
                or
                <span className="h-px flex-1 bg-border-subtle" />
              </div>
            </>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <Field>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                invalid={Boolean(error)}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field>
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="mb-0">
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="mb-1.5 text-sm font-medium text-brand-700 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                invalid={Boolean(error)}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <FieldError>{error}</FieldError>
            </Field>

            <Button type="submit" loading={loading} className="mt-2 w-full">
              Log in
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="mt-6 text-center text-sm text-zinc-600">
        Don&apos;t have an account?{" "}
        <Link
          href={
            searchParams.get("callbackUrl")
              ? `/register?callbackUrl=${encodeURIComponent(searchParams.get("callbackUrl")!)}`
              : "/register"
          }
          className="font-medium text-brand-700 hover:underline"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}

export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  return (
    <Suspense>
      <LoginFormInner googleEnabled={googleEnabled} />
    </Suspense>
  );
}

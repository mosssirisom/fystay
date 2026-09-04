import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { googleSignInEnabled } from "@/lib/authProviders";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = { title: "Log in", robots: { index: false } };

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return <LoginForm googleEnabled={googleSignInEnabled} />;
}

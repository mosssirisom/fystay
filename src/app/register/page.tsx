import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { googleSignInEnabled } from "@/lib/authProviders";
import { RegisterForm } from "@/components/RegisterForm";

export const metadata: Metadata = { title: "Sign up" };

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return <RegisterForm googleEnabled={googleSignInEnabled} />;
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";

export const metadata: Metadata = { title: "Reset password", robots: { index: false } };

export default async function ForgotPasswordPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return <ForgotPasswordForm />;
}

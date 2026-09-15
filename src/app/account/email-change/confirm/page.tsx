import type { Metadata } from "next";
import { EmailChangeConfirmForm } from "@/components/EmailChangeConfirmForm";

export const metadata: Metadata = { title: "Confirm email change", robots: { index: false } };

export default function EmailChangeConfirmPage() {
  return <EmailChangeConfirmForm />;
}

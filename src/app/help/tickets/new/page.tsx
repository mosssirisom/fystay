import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { auth } from "@/auth";
import { Card, CardContent } from "@/components/ui/Card";
import { NewSupportTicketForm } from "@/components/NewSupportTicketForm";

export const metadata: Metadata = { title: "New support ticket", robots: { index: false } };

export default async function NewSupportTicketPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/help/tickets/new");

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
      <Link
        href="/help/tickets"
        className="focus-ring -ml-1 inline-flex items-center gap-1 self-start rounded-lg py-1 pr-2 text-sm font-medium text-stone-600 hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Support tickets
      </Link>

      <h1 className="mt-3 text-2xl font-bold text-foreground">Contact FYStay support</h1>
      <p className="mt-2 text-sm text-stone-500">
        Tell us what&apos;s going on and we&apos;ll reply here as soon as we can.
      </p>

      <Card className="mt-6">
        <CardContent className="p-5">
          <NewSupportTicketForm />
        </CardContent>
      </Card>
    </div>
  );
}

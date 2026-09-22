import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LifeBuoy, Plus } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { previewMessage } from "@/lib/messaging";
import { Card } from "@/components/ui/Card";
import { Badge, type BadgeProps } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Support tickets", robots: { index: false } };

const STATUS_VARIANT: Record<string, BadgeProps["variant"]> = {
  OPEN: "warning",
  RESOLVED: "success",
  CLOSED: "neutral",
};

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** The signed-in user's own support tickets, newest activity first - see /contact for the entry point into opening one. */
export default async function SupportTicketsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/help/tickets");

  const tickets = await prisma.supportTicket.findMany({
    where: { openedById: session.user.id },
    include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-foreground">Support tickets</h1>
        <Link href="/help/tickets/new">
          <Button type="button" size="sm">
            <Plus className="h-4 w-4" aria-hidden />
            New ticket
          </Button>
        </Link>
      </div>

      {tickets.length === 0 ? (
        <Card className="mt-8 flex flex-col items-center gap-3 p-12 text-center">
          <LifeBuoy className="h-8 w-8 text-stone-300" />
          <p className="font-medium text-foreground">No support tickets yet</p>
          <p className="max-w-sm text-sm text-stone-500">
            Need help with something a host or FYStay support should look into? Open a ticket and
            we&apos;ll get back to you here.
          </p>
          <Link href="/help/tickets/new">
            <Button type="button" size="sm">
              Open a ticket
            </Button>
          </Link>
        </Card>
      ) : (
        <ul className="mt-6 flex flex-col gap-2">
          {tickets.map((ticket) => {
            const lastMessage = ticket.messages[0];
            return (
              <li key={ticket.id}>
                <Link
                  href={`/help/tickets/${ticket.id}`}
                  className="focus-ring flex flex-col gap-1 rounded-2xl border border-border-subtle bg-surface p-4 transition hover:border-stone-300"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-medium text-foreground">{ticket.subject}</p>
                    <Badge variant={STATUS_VARIANT[ticket.status]}>{ticket.status}</Badge>
                  </div>
                  {lastMessage && (
                    <p className="truncate text-sm text-stone-500">{previewMessage(lastMessage.body)}</p>
                  )}
                  <p className="text-xs text-stone-500">{dateFormatter.format(ticket.updatedAt)}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

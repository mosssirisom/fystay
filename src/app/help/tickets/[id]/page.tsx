import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isTicketOpener } from "@/lib/supportTickets";
import { SupportTicketComposer } from "@/components/SupportTicketComposer";
import { Badge, type BadgeProps } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

const STATUS_VARIANT: Record<string, BadgeProps["variant"]> = {
  OPEN: "warning",
  RESOLVED: "success",
  CLOSED: "neutral",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const ticket = await prisma.supportTicket.findUnique({ where: { id }, select: { subject: true } });
  return { title: ticket ? ticket.subject : "Support ticket", robots: { index: false } };
}

/**
 * A ticket's own thread, for the person who opened it - an admin's reply
 * shows as "FYStay support" rather than a named user, since who on the
 * support team wrote it isn't meaningful to the guest/host reading it (the
 * same reasoning a company support inbox usually shows "Support", not the
 * individual agent).
 */
export default async function SupportTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=/help/tickets/${id}`);

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        select: { id: true, body: true, isAdminReply: true, createdAt: true },
      },
    },
  });
  if (!ticket) notFound();
  if (!isTicketOpener(ticket, session.user.id)) redirect("/help/tickets");

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-8">
      <Link
        href="/help/tickets"
        className="focus-ring -ml-1 inline-flex items-center gap-1 self-start rounded-lg py-1 pr-2 text-sm font-medium text-stone-600 hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Support tickets
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-foreground">{ticket.subject}</h1>
        <Badge variant={STATUS_VARIANT[ticket.status]}>{ticket.status}</Badge>
      </div>

      <ul className="mt-6 flex flex-1 flex-col gap-3">
        {ticket.messages.map((message) => (
          <li key={message.id} className={cn("flex", message.isAdminReply ? "justify-start" : "justify-end")}>
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-line",
                message.isAdminReply
                  ? "border border-border-subtle bg-surface text-foreground"
                  : "bg-brand-700 text-white",
              )}
            >
              {message.isAdminReply && (
                <p className="mb-1 text-xs font-semibold text-brand-700">FYStay support</p>
              )}
              {message.body}
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6">
        <SupportTicketComposer ticketId={ticket.id} />
      </div>
    </div>
  );
}

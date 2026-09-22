import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge, type BadgeProps } from "@/components/ui/Badge";
import { AdminTicketPanel } from "@/components/admin/AdminTicketPanel";
import { cn } from "@/lib/cn";
import type { SupportTicketStatus } from "@prisma/client";

export const metadata: Metadata = { title: "Support ticket", robots: { index: false } };

const STATUS_VARIANT: Record<SupportTicketStatus, BadgeProps["variant"]> = {
  OPEN: "warning",
  RESOLVED: "success",
  CLOSED: "neutral",
};

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** Support's full view of one ticket: opener/about-user/booking context, the whole thread, and the reply + status panel. */
export default async function AdminSupportTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=/admin/support-tickets/${id}`);
  if (session.user.role !== "ADMIN") redirect("/");

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      openedBy: { select: { id: true, name: true, email: true } },
      aboutUser: { select: { id: true, name: true, email: true } },
      booking: { select: { id: true, reference: true, listing: { select: { title: true } } } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { id: true, name: true } } },
      },
    },
  });
  if (!ticket) notFound();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-8">
      <Link
        href="/admin/support-tickets"
        className="focus-ring -ml-1 inline-flex items-center gap-1 self-start rounded-lg py-1 pr-2 text-sm font-medium text-stone-600 hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Support tickets
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-foreground">{ticket.subject}</h1>
        <Badge variant={STATUS_VARIANT[ticket.status]}>{ticket.status}</Badge>
      </div>

      <Card className="mt-4">
        <CardContent className="flex flex-col gap-1.5 p-5 text-sm">
          <p>
            <span className="font-medium text-foreground">Opened by:</span>{" "}
            <Link href={`/admin/users/${ticket.openedBy.id}`} className="text-brand-700 hover:underline">
              {ticket.openedBy.name}
            </Link>{" "}
            <span className="text-stone-500">({ticket.openedBy.email})</span>
          </p>
          {ticket.aboutUser && (
            <p>
              <span className="font-medium text-foreground">About:</span>{" "}
              <Link href={`/admin/users/${ticket.aboutUser.id}`} className="text-brand-700 hover:underline">
                {ticket.aboutUser.name}
              </Link>{" "}
              <span className="text-stone-500">({ticket.aboutUser.email})</span>
            </p>
          )}
          {ticket.booking && (
            <p>
              <span className="font-medium text-foreground">Booking:</span>{" "}
              <Link href={`/admin/bookings/${ticket.booking.id}`} className="text-brand-700 hover:underline">
                {ticket.booking.reference}
              </Link>{" "}
              <span className="text-stone-500">({ticket.booking.listing.title})</span>
            </p>
          )}
        </CardContent>
      </Card>

      <ul className="mt-6 flex flex-1 flex-col gap-3">
        {ticket.messages.map((message) => (
          <li key={message.id} className={cn("flex flex-col", message.isAdminReply ? "items-start" : "items-end")}>
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-line",
                message.isAdminReply
                  ? "bg-brand-700 text-white"
                  : "border border-border-subtle bg-surface text-foreground",
              )}
            >
              {message.body}
            </div>
            <p className="mt-1 text-xs text-stone-500">
              {message.isAdminReply ? "FYStay support" : message.sender.name} ·{" "}
              {dateFormatter.format(message.createdAt)}
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-6">
        <AdminTicketPanel ticketId={ticket.id} status={ticket.status} />
      </div>
    </div>
  );
}

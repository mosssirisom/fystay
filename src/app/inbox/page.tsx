import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { otherParticipant, previewMessage } from "@/lib/messaging";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Messages", robots: { index: false } };

export default async function InboxPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/inbox");
  const userId = session.user.id;

  const conversations = await prisma.conversation.findMany({
    where: { OR: [{ guestId: userId }, { hostId: userId }] },
    include: {
      listing: { select: { title: true } },
      guest: { select: { id: true, name: true } },
      host: { select: { id: true, name: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });

  const unreadByConversation = await prisma.message.groupBy({
    by: ["conversationId"],
    where: {
      conversationId: { in: conversations.map((c) => c.id) },
      senderId: { not: userId },
      readAt: null,
    },
    _count: { _all: true },
  });
  const unreadCounts = new Map(unreadByConversation.map((row) => [row.conversationId, row._count._all]));

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
      <h1 className="text-2xl font-bold text-foreground">Messages</h1>

      {conversations.length === 0 ? (
        <Card className="mt-8 flex flex-col items-center gap-3 p-12 text-center">
          <MessageCircle className="h-8 w-8 text-stone-300" />
          <p className="font-medium text-foreground">No messages yet</p>
          <p className="max-w-sm text-sm text-stone-500">
            Questions to a host, or from a guest about one of your listings, will show up here.
          </p>
        </Card>
      ) : (
        <ul className="mt-6 flex flex-col gap-2">
          {conversations.map((conversation) => {
            const counterparty = otherParticipant(conversation, userId);
            const lastMessage = conversation.messages[0];
            const unreadCount = unreadCounts.get(conversation.id) ?? 0;
            return (
              <li key={conversation.id}>
                <Link
                  href={`/inbox/${conversation.id}`}
                  className="focus-ring flex items-center gap-3 rounded-2xl border border-border-subtle bg-surface p-4 transition hover:border-stone-300"
                >
                  <Avatar name={counterparty.name} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-medium text-foreground">{counterparty.name}</p>
                      {unreadCount > 0 && <Badge variant="brand">{unreadCount} new</Badge>}
                    </div>
                    <p className="truncate text-sm text-stone-500">{conversation.listing.title}</p>
                    {lastMessage && (
                      <p
                        className={cn(
                          "mt-0.5 truncate text-sm",
                          unreadCount > 0 ? "font-medium text-foreground" : "text-stone-500",
                        )}
                      >
                        {previewMessage(lastMessage.body)}
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

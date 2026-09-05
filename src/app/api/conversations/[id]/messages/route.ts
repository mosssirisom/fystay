import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { isConversationParticipant } from "@/lib/messaging";
import { createMessage } from "@/app/api/conversations/route";

const replySchema = z.object({
  body: z.string().trim().min(1, "Write a message first.").max(4000, "Message is too long."),
});

/** A reply into an existing conversation - either participant, in either direction. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = replySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const conversation = await prisma.conversation.findUnique({ where: { id } });
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }
  if (!isConversationParticipant(conversation, session.user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const message = await createMessage(id, session.user.id, parsed.data.body);

  return NextResponse.json(
    {
      message: {
        id: message.id,
        body: message.body,
        createdAt: message.createdAt.toISOString(),
        fromMe: true,
      },
    },
    { status: 201 },
  );
}

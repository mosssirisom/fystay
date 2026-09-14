import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

const createOfferingSchema = z.object({
  providerId: z.string().min(1),
  name: z.string().trim().min(1, "Name is required").max(200),
  description: z.string().trim().max(1000).optional(),
  category: z.enum(["AIRPORT_TRANSFER", "ATTRACTION_TICKET", "CAR_HIRE"]),
  priceCents: z.number().int().min(1, "Price must be more than £0"),
});

/** One bookable, priced Trip Extra under a provider - see ExtraOffering's own schema comment. ADMIN-only. */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createOfferingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const provider = await prisma.extraProvider.findUnique({ where: { id: parsed.data.providerId } });
  if (!provider) {
    return NextResponse.json({ error: "That provider doesn't exist" }, { status: 404 });
  }

  const existing = await prisma.extraOffering.findUnique({
    where: { providerId_name: { providerId: provider.id, name: parsed.data.name } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "This provider already has an offering with this name" },
      { status: 409 },
    );
  }

  const offering = await prisma.extraOffering.create({
    data: {
      providerId: provider.id,
      name: parsed.data.name,
      description: parsed.data.description?.trim() || null,
      category: parsed.data.category,
      priceCents: parsed.data.priceCents,
    },
  });

  return NextResponse.json({ offering }, { status: 201 });
}

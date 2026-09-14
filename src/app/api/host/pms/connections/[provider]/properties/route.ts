import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPmsAdapter } from "@/lib/pms/registry";
import { parseProvider } from "@/lib/pms/routeHelpers";
import { getValidCredentials } from "@/lib/pms/sync";
import { PmsAdapterError } from "@/lib/pms/types";

async function loadConnectedConnection(hostId: string, providerParam: string) {
  const provider = parseProvider(providerParam);
  if (!provider) return { error: NextResponse.json({ error: "Unknown provider" }, { status: 400 }) } as const;

  const connection = await prisma.pmsConnection.findUnique({ where: { hostId_provider: { hostId, provider } } });
  if (!connection || !connection.credentialsCiphertext) {
    return { error: NextResponse.json({ error: "Not connected" }, { status: 404 }) } as const;
  }
  return { connection, provider } as const;
}

/** Lists the properties this connection's authenticated account can see - the host picks one to import from next (see POST below). Most hosts only manage one property on the PMS side, but a multi-property account still needs to choose. */
export async function GET(_request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider: providerParam } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const loaded = await loadConnectedConnection(session.user.id, providerParam);
  if ("error" in loaded) return loaded.error;
  const { connection, provider } = loaded;

  const adapter = getPmsAdapter(provider);
  try {
    const credentials = await getValidCredentials(prisma, connection, adapter);
    if (!credentials) return NextResponse.json({ error: "Not connected" }, { status: 404 });
    const properties = await adapter.listProperties(credentials);
    return NextResponse.json({ properties });
  } catch (error) {
    const message = error instanceof PmsAdapterError ? error.message : "Could not list properties";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

const selectPropertySchema = z.object({
  externalPropertyId: z.string().min(1),
  name: z.string().min(1),
});

/** Sets which PMS property this connection imports from - required before rooms can be listed/mapped, since every other adapter call is scoped to one property. */
export async function POST(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider: providerParam } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const loaded = await loadConnectedConnection(session.user.id, providerParam);
  if ("error" in loaded) return loaded.error;
  const { connection } = loaded;

  const body = await request.json().catch(() => null);
  const parsed = selectPropertySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  await prisma.pmsConnection.update({
    where: { id: connection.id },
    data: { externalPropertyId: parsed.data.externalPropertyId, externalPropertyName: parsed.data.name },
  });

  return NextResponse.json({ selected: true });
}

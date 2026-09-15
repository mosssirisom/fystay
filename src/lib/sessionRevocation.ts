import type { PrismaClient } from "@prisma/client";

/**
 * Invalidates every JWT already issued to this account by bumping
 * User.sessionVersion - the jwt callback in src/auth.ts compares its own
 * stamped copy against this column on every session read and signs out
 * anything that no longer matches. Called wherever an account's existing
 * sessions genuinely shouldn't be trusted anymore: a password reset,
 * self-service account deletion, an admin suspending the account, or the
 * user's own "sign out of all devices" action.
 */
export async function revokeAllSessions(prisma: PrismaClient, userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { sessionVersion: { increment: 1 } },
  });
}

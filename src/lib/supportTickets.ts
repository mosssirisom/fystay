import type { SupportTicketStatus } from "@prisma/client";

export type TicketOpener = { openedById: string };

/**
 * True if userId is the ticket's own opener - the only non-admin allowed to
 * read or reply to it (see Conversation's isConversationParticipant for the
 * two-party analog). An admin's own visibility is a separate role check at
 * the API boundary, not folded into this, since "is the opener" and "is an
 * admin" are independent, either-is-enough conditions.
 */
export function isTicketOpener(ticket: TicketOpener, userId: string): boolean {
  return ticket.openedById === userId;
}

/**
 * What a ticket's status should become after a new message is added to it.
 * A support team marking a ticket RESOLVED/CLOSED doesn't mean the opener
 * can't still follow up, so a message from the ticket's own opener always
 * reopens it - but an admin replying (isAdminReply: true) never changes the
 * status on its own, so an admin can resolve a ticket and leave a final
 * reply in the same request without it immediately reopening.
 *
 * Only ever call this for a message actually being created; it says nothing
 * about a status change made independently via the status endpoint.
 */
export function nextStatusAfterMessage(
  currentStatus: SupportTicketStatus,
  isAdminReply: boolean,
): SupportTicketStatus {
  if (isAdminReply) return currentStatus;
  return "OPEN";
}

export type ConversationParticipants = { guestId: string; hostId: string };

/** True if userId is either side of the conversation - the only two people ever allowed to read or reply to it. */
export function isConversationParticipant(
  conversation: ConversationParticipants,
  userId: string,
): boolean {
  return conversation.guestId === userId || conversation.hostId === userId;
}

export type ConversationCounterparty = { id: string; name: string };

/**
 * The *other* person in a conversation, from a given viewer's side - whichever
 * of guest/host isn't them. Only meaningful for an actual participant (see
 * isConversationParticipant, checked at the API boundary before this is ever
 * called) - there's no sensible "other party" to show anyone else.
 */
export function otherParticipant(
  conversation: {
    guestId: string;
    guest: ConversationCounterparty;
    hostId: string;
    host: ConversationCounterparty;
  },
  viewerId: string,
): ConversationCounterparty {
  return conversation.guestId === viewerId ? conversation.host : conversation.guest;
}

const PREVIEW_MAX_LENGTH = 80;

/**
 * A single-line preview of a message body for the inbox list - collapses
 * whitespace (a guest's message might be multiple paragraphs) and truncates
 * with an ellipsis, rather than ever letting a long message wrap or push
 * other rows around in a list that's meant to stay scannable.
 */
export function previewMessage(body: string, maxLength: number = PREVIEW_MAX_LENGTH): string {
  const singleLine = body.replace(/\s+/g, " ").trim();
  if (singleLine.length <= maxLength) return singleLine;
  return `${singleLine.slice(0, maxLength - 1).trimEnd()}…`;
}

/**
 * Catches the one data-quality issue that actually matters for guest trust:
 * a host's free-text description claiming a different bedroom count than
 * the structured `bedrooms` field the rest of the site (stats row, search
 * filters, JSON-LD) treats as the real number. The structured field is
 * always the single source of truth everywhere it's displayed - this
 * exists only to warn a host, while they're editing, that their own prose
 * disagrees with their own number, so the two don't quietly drift apart
 * the way free text and a form field always can.
 */
// Allows at most one adjective between the number and "bed(room)" - "2-bedroom"
// and "two comfortable bedrooms" both match, but a number far earlier in an
// unrelated sentence ("sleeps up to 2, two minutes from the beach, bedrooms
// are...") doesn't get pulled in as if it were naming a count.
const BEDROOM_MENTION_PATTERN =
  /\b(\d+|one|two|three|four|five|six|seven|eight)[\s-]+(?:\w+[\s-]+)?bed(?:room)?s?\b/gi;

const WORD_TO_NUMBER: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
};

/**
 * Every distinct bedroom count the description text seems to mention
 * ("2-bedroom", "two bedrooms", "3 beds") - not just the first match, so a
 * description that mentions two different numbers in two different places
 * is still caught even if one of them happens to agree with the form.
 */
export function mentionedBedroomCounts(description: string): number[] {
  const counts = new Set<number>();
  for (const match of description.matchAll(BEDROOM_MENTION_PATTERN)) {
    const raw = match[1].toLowerCase();
    const value = WORD_TO_NUMBER[raw] ?? Number.parseInt(raw, 10);
    if (Number.isFinite(value) && value > 0) counts.add(value);
  }
  return [...counts];
}

/**
 * True only when the description clearly states a bedroom count and it
 * disagrees with every number mentioned - never flagged just because the
 * description doesn't mention bedrooms at all, since plenty of genuine
 * descriptions don't.
 */
export function hasBedroomCountMismatch(description: string, bedrooms: number): boolean {
  const mentioned = mentionedBedroomCounts(description);
  return mentioned.length > 0 && !mentioned.includes(bedrooms);
}

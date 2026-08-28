import { randomInt } from "node:crypto";

// Excludes visually ambiguous characters (0/O, 1/I) so a guest reading the
// reference off a screen or over the phone can't misdial it.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;

/** A short, human-friendly booking reference, e.g. "FY-7K3PQ9XM". */
export function generateBookingReference(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[randomInt(ALPHABET.length)];
  }
  return `FY-${code}`;
}

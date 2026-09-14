import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const SALT = "fystay-pms-credentials";

/**
 * Derives a fixed 32-byte key from PMS_ENCRYPTION_KEY once per process,
 * rather than storing the raw env value as the AES key directly - lets the
 * env var be any length/format (a passphrase, a generated hex string)
 * instead of requiring the operator to produce exactly 32 bytes themselves.
 */
function getKey(): Buffer {
  const secret = process.env.PMS_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error(
      "PMS_ENCRYPTION_KEY is not set - required to store or read PMS provider credentials. See .env.example.",
    );
  }
  return scryptSync(secret, SALT, 32);
}

/**
 * Encrypts a PMS connection's credentials (an OAuth token pair, an API key,
 * whatever shape the provider needs) for storage in
 * PmsConnection.credentialsCiphertext. Never called with plaintext that
 * should reach the browser - this is a server-only encrypt-at-rest layer,
 * not a substitute for keeping the key itself out of client code.
 */
export function encryptPmsCredentials(credentials: unknown): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const plaintext = Buffer.from(JSON.stringify(credentials), "utf8");
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // iv.authTag.ciphertext, each base64 - one opaque string column rather
  // than three, so a mapping/select never has to remember to fetch all
  // three parts together.
  return [iv.toString("base64"), authTag.toString("base64"), encrypted.toString("base64")].join(".");
}

/**
 * Reverses encryptPmsCredentials. Throws on a malformed or tampered
 * ciphertext (GCM's own auth-tag check) rather than returning something
 * that looks like valid JSON but isn't - a caller that gets this wrong is
 * about to make an authenticated call with garbage credentials, which
 * should fail loudly, not silently.
 */
export function decryptPmsCredentials<T = unknown>(ciphertext: string): T {
  const key = getKey();
  const [ivB64, authTagB64, dataB64] = ciphertext.split(".");
  if (!ivB64 || !authTagB64 || !dataB64) {
    throw new Error("Malformed PMS credentials ciphertext");
  }
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(authTagB64, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]);
  return JSON.parse(decrypted.toString("utf8")) as T;
}

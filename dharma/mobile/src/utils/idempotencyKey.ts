import * as Crypto from "expo-crypto";

/**
 * Generates a new RFC 4122 v4 UUID using a cryptographically secure random
 * source. Each order submission uses a freshly generated key; automatic retries
 * of the same logical submission must reuse the key instead of calling this again.
 */
export function generateIdempotencyKey(): string {
  return Crypto.randomUUID();
}
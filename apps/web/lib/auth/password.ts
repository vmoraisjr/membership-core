import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SCRYPT_KEY_LENGTH = 64;

function normalizePassword(password: string) {
  return password.normalize("NFKC");
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(
    normalizePassword(password),
    salt,
    SCRYPT_KEY_LENGTH
  ).toString("hex");

  return `${salt}:${derivedKey}`;
}

export function verifyPassword(
  password: string,
  storedHash: string
) {
  const [salt, expectedHash] =
    storedHash.split(":");

  if (!salt || !expectedHash) {
    return false;
  }

  const actualHash = scryptSync(
    normalizePassword(password),
    salt,
    SCRYPT_KEY_LENGTH
  );
  const expectedBuffer = Buffer.from(
    expectedHash,
    "hex"
  );

  if (
    actualHash.byteLength !==
    expectedBuffer.byteLength
  ) {
    return false;
  }

  return timingSafeEqual(
    actualHash,
    expectedBuffer
  );
}

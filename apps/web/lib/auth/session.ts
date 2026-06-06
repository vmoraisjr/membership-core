import { createHash, randomBytes } from "node:crypto";

import { isProduction } from "@/lib/env";
import {
  AUTH_SESSION_TTL_MS,
  PASSWORD_RESET_TTL_MS,
  USER_INVITE_TTL_MS,
} from "@/lib/auth/constants";

export { AUTH_SESSION_COOKIE } from "@/lib/auth/constants";

export function createOpaqueToken() {
  return randomBytes(32).toString("hex");
}

export function hashOpaqueToken(
  token: string
) {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

export function getSessionExpiryDate() {
  return new Date(
    Date.now() + AUTH_SESSION_TTL_MS
  );
}

export function getPasswordResetExpiryDate() {
  return new Date(
    Date.now() + PASSWORD_RESET_TTL_MS
  );
}

export function getUserInviteExpiryDate() {
  return new Date(
    Date.now() + USER_INVITE_TTL_MS
  );
}

export function getAuthCookieOptions(
  expires: Date
) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProduction(),
    path: "/",
    expires,
  };
}

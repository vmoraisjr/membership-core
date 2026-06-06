"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { createAuthSession } from "../services/create-auth-session";
import { authenticateAppUser } from "../services/authenticate-app-user";
import { ensureDefaultAppUsers } from "../services/get-current-app-user";
import {
  AUTH_SESSION_COOKIE,
  getAuthCookieOptions,
} from "@/lib/auth/session";

function getSafeNextPath(next: string) {
  if (
    next.startsWith("/dashboard")
  ) {
    return next;
  }

  return "/dashboard";
}

export async function loginAction(
  formData: FormData
) {
  await ensureDefaultAppUsers();

  const email = String(
    formData.get("email") ?? ""
  );
  const password = String(
    formData.get("password") ?? ""
  );
  const next = getSafeNextPath(
    String(
      formData.get("next") ??
        "/dashboard"
    )
  );

  const matchedUser =
    await authenticateAppUser({
      email,
      password,
    });

  if (!matchedUser) {
    redirect(
      `/login?error=invalid_credentials&next=${encodeURIComponent(
        next
      )}`
    );
  }

  const { token, expiresAt } =
    await createAuthSession(
      matchedUser.id
    );
  const cookieStore = await cookies();

  cookieStore.set(
    AUTH_SESSION_COOKIE,
    token,
    getAuthCookieOptions(
      expiresAt
    )
  );

  redirect(next);
}

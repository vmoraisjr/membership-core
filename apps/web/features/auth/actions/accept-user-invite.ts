"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { acceptUserInvite } from "../services/accept-user-invite";
import { createAuthSession } from "../services/create-auth-session";
import {
  AUTH_SESSION_COOKIE,
  getAuthCookieOptions,
} from "@/lib/auth/session";

export async function acceptUserInviteAction(
  formData: FormData
) {
  const token = String(
    formData.get("token") ?? ""
  );
  const name = String(
    formData.get("name") ?? ""
  ).trim();
  const password = String(
    formData.get("password") ?? ""
  );
  const confirmPassword = String(
    formData.get("confirmPassword") ??
      ""
  );

  if (!name) {
    redirect(
      `/invite?token=${encodeURIComponent(
        token
      )}&error=missing_name`
    );
  }

  if (password.length < 8) {
    redirect(
      `/invite?token=${encodeURIComponent(
        token
      )}&error=password_too_short`
    );
  }

  if (password !== confirmPassword) {
    redirect(
      `/invite?token=${encodeURIComponent(
        token
      )}&error=password_mismatch`
    );
  }

  try {
    const user =
      await acceptUserInvite(
        token,
        name,
        password
      );
    const { token: sessionToken, expiresAt } =
      await createAuthSession(
        user.id
      );
    const cookieStore =
      await cookies();

    cookieStore.set(
      AUTH_SESSION_COOKIE,
      sessionToken,
      getAuthCookieOptions(
        expiresAt
      )
    );
  } catch {
    redirect(
      `/invite?token=${encodeURIComponent(
        token
      )}&error=invalid_token`
    );
  }

  redirect("/dashboard");
}

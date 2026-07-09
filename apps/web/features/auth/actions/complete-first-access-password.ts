"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  AUTH_SESSION_COOKIE,
  getAuthCookieOptions,
} from "@/lib/auth/session";
import { createAuthSession } from "@/features/auth/services/create-auth-session";
import { requireCurrentAppUser } from "@/features/auth/services/get-current-app-user";
import {
  getCurrentAuditActor,
} from "@/features/audit-log/services/create-audit-log";
import { completeFirstAccessPassword } from "../services/complete-first-access-password";

export async function completeFirstAccessPasswordAction(
  formData: FormData
) {
  const currentUser =
    await requireCurrentAppUser();

  if (!currentUser.mustChangePassword) {
    redirect("/dashboard");
  }

  const password = String(
    formData.get("password") ?? ""
  );
  const confirmPassword = String(
    formData.get("confirmPassword") ??
      ""
  );

  if (password.length < 8) {
    redirect(
      "/first-access?error=password_too_short"
    );
  }

  if (password !== confirmPassword) {
    redirect(
      "/first-access?error=password_mismatch"
    );
  }

  const actor =
    await getCurrentAuditActor();

  await completeFirstAccessPassword({
    appUserId: currentUser.id,
    clinicId:
      currentUser.clinicId ?? null,
    email: currentUser.email,
    actorDisplayName:
      actor.displayName,
    actorUserId: actor.id,
    nextPassword: password,
  });

  const {
    token,
    expiresAt,
  } = await createAuthSession(
    currentUser.id
  );
  const cookieStore = await cookies();

  cookieStore.set(
    AUTH_SESSION_COOKIE,
    token,
    getAuthCookieOptions(expiresAt)
  );

  redirect("/dashboard");
}

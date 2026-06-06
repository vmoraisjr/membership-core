"use server";

import { redirect } from "next/navigation";

import { resetPasswordWithToken } from "../services/reset-password-with-token";

export async function resetPasswordAction(
  formData: FormData
) {
  const token = String(
    formData.get("token") ?? ""
  );
  const password = String(
    formData.get("password") ?? ""
  );
  const confirmPassword = String(
    formData.get("confirmPassword") ??
      ""
  );

  if (password.length < 8) {
    redirect(
      `/reset-password?token=${encodeURIComponent(
        token
      )}&error=password_too_short`
    );
  }

  if (password !== confirmPassword) {
    redirect(
      `/reset-password?token=${encodeURIComponent(
        token
      )}&error=password_mismatch`
    );
  }

  try {
    await resetPasswordWithToken(
      token,
      password
    );
  } catch {
    redirect(
      `/reset-password?token=${encodeURIComponent(
        token
      )}&error=invalid_token`
    );
  }

  redirect(
    "/login?status=password_reset"
  );
}

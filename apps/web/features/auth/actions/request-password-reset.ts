"use server";

import { redirect } from "next/navigation";

import prisma from "@/lib/prisma";

import { createPasswordResetToken } from "../services/create-password-reset-token";
import { ensureDefaultAppUsers } from "../services/get-current-app-user";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function requestPasswordResetAction(
  formData: FormData
) {
  await ensureDefaultAppUsers();

  const email = normalizeEmail(
    String(
      formData.get("email") ?? ""
    )
  );

  if (email) {
    const user =
      await prisma.appUser.findUnique({
        where: {
          email,
        },
      });

    if (user) {
      await createPasswordResetToken(
        user.id
      );
    }
  }

  redirect(
    "/forgot-password?status=sent"
  );
}

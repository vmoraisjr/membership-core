"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import {
  APP_ROLE_COOKIE,
  type AppRole,
  isAppRole,
} from "../constants/roles";

export async function setCurrentUserRole(
  role: AppRole
) {
  if (!isAppRole(role)) {
    throw new Error("Invalid role.");
  }

  const cookieStore = await cookies();

  cookieStore.set(APP_ROLE_COOKIE, role, {
    path: "/",
    sameSite: "lax",
  });

  revalidatePath("/dashboard");
}

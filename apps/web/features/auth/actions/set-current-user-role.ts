"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import {
  APP_ROLE_COOKIE,
  APP_USER_COOKIE,
  type AppRole,
  isAppRole,
} from "../constants/roles";
import { getAvailableAppUsers } from "../services/get-current-app-user";

export async function setCurrentUserRole(
  role: AppRole
) {
  if (!isAppRole(role)) {
    throw new Error("Invalid role.");
  }

  const cookieStore = await cookies();
  const users =
    await getAvailableAppUsers();
  const matchedUser =
    users.find(
      (user) => user.role === role
    ) ?? users[0];

  if (!matchedUser) {
    throw new Error(
      "No application users are available."
    );
  }

  cookieStore.set(APP_ROLE_COOKIE, role, {
    path: "/",
    sameSite: "lax",
  });
  cookieStore.set(
    APP_USER_COOKIE,
    matchedUser.id,
    {
      path: "/",
      sameSite: "lax",
    }
  );

  revalidatePath("/dashboard");
}

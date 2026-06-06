"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import {
  APP_ROLE_COOKIE,
  APP_USER_COOKIE,
} from "../constants/roles";
import { getAvailableAppUsers } from "../services/get-current-app-user";

export async function setCurrentAppUser(
  userId: string
) {
  const cookieStore = await cookies();
  const users =
    await getAvailableAppUsers();
  const matchedUser = users.find(
    (user) => user.id === userId
  );

  if (!matchedUser) {
    throw new Error("Invalid user.");
  }

  cookieStore.set(
    APP_USER_COOKIE,
    matchedUser.id,
    {
      path: "/",
      sameSite: "lax",
    }
  );
  cookieStore.set(
    APP_ROLE_COOKIE,
    matchedUser.role,
    {
      path: "/",
      sameSite: "lax",
    }
  );

  revalidatePath("/dashboard");
}

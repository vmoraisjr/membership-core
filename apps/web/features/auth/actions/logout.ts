"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { deleteAuthSession } from "../services/delete-auth-session";
import { AUTH_SESSION_COOKIE } from "@/lib/auth/session";

export async function logoutAction() {
  const cookieStore = await cookies();
  const sessionToken =
    cookieStore.get(
      AUTH_SESSION_COOKIE
    )?.value;

  await deleteAuthSession(
    sessionToken
  );
  cookieStore.delete(
    AUTH_SESSION_COOKIE
  );

  redirect("/login");
}

import { cookies } from "next/headers";

import {
  APP_ROLE_COOKIE,
  DEFAULT_APP_ROLE,
  isAppRole,
} from "../constants/roles";

export async function getCurrentUserRole() {
  const cookieStore = await cookies();
  const storedRole =
    cookieStore.get(APP_ROLE_COOKIE)
      ?.value;

  if (
    storedRole &&
    isAppRole(storedRole)
  ) {
    return storedRole;
  }

  return DEFAULT_APP_ROLE;
}

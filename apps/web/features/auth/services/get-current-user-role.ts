import { getCurrentAppUser } from "./get-current-app-user";

export async function getCurrentUserRole() {
  const currentUser =
    await getCurrentAppUser();

  if (!currentUser) {
    throw new Error(
      "Authentication required."
    );
  }

  return currentUser.role;
}

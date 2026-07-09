import { redirect } from "next/navigation";

import { getCurrentAppUser } from "@/features/auth/services/get-current-app-user";

export default async function Page() {
  const currentUser =
    await getCurrentAppUser();

  redirect(
    currentUser
      ? currentUser.mustChangePassword
        ? "/first-access"
        : "/dashboard"
      : "/login"
  );
}

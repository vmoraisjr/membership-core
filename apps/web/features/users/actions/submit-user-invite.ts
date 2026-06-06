"use server";

import { redirect } from "next/navigation";

import { createUserInviteAction } from "@/features/auth/actions/create-user-invite";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to create the invite.";
}

export async function submitUserInviteAction(
  formData: FormData
) {
  const email = String(
    formData.get("email") ?? ""
  )
    .trim()
    .toLowerCase();
  const role = String(
    formData.get("role") ?? ""
  ).trim();

  try {
    const invite =
      await createUserInviteAction(
        formData
      );
    const params =
      new URLSearchParams({
        inviteCreated: "1",
        inviteEmail: email,
        inviteRole: role,
        inviteToken: invite.token,
        inviteExpiresAt:
          invite.expiresAt.toISOString(),
      });

    redirect(
      `/dashboard/users?${params.toString()}`
    );
  } catch (error) {
    const params =
      new URLSearchParams({
        inviteError:
          getErrorMessage(error),
      });

    if (email) {
      params.set(
        "inviteEmail",
        email
      );
    }

    if (role) {
      params.set(
        "inviteRole",
        role
      );
    }

    redirect(
      `/dashboard/users?${params.toString()}`
    );
  }
}

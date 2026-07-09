"use server";

import { redirect } from "next/navigation";

import { createUserInviteAction } from "@/features/auth/actions/create-user-invite";

function isRedirectErrorLike(
  error: unknown
) {
  return Boolean(
    typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      typeof (
        error as { digest?: unknown }
      ).digest === "string" &&
      (
        error as { digest: string }
      ).digest.startsWith(
        "NEXT_REDIRECT"
      )
  );
}

function getErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return "Nao foi possivel criar o convite.";
  }

  switch (error.message) {
    case "Invalid role.":
      return "Perfil de convite invalido.";
    case "Current user is not assigned to a clinic.":
      return "O usuario atual precisa estar vinculado a uma clinica para enviar convites.";
    case "You do not have permission to assign this role.":
      return "Voce nao tem permissao para atribuir esse perfil.";
    case "This email is already assigned to another clinic user.":
      return "Este e-mail ja esta vinculado a outra clinica.";
    case "An active clinic user already exists with this email.":
      return "Ja existe um usuario ativo com este e-mail.";
    default:
      return error.message;
  }
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
    if (isRedirectErrorLike(error)) {
      throw error;
    }

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

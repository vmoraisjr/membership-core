import { redirect } from "next/navigation";

import { completeFirstAccessPasswordAction } from "@/features/auth/actions/complete-first-access-password";
import { getCurrentAppUser } from "@/features/auth/services/get-current-app-user";

type Props = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

function getErrorMessage(error?: string) {
  switch (error) {
    case "password_too_short":
      return "A nova senha precisa ter pelo menos 8 caracteres.";
    case "password_mismatch":
      return "A confirmação de senha precisa ser igual à nova senha.";
    default:
      return null;
  }
}

export default async function FirstAccessPage({
  searchParams,
}: Props) {
  const currentUser =
    await getCurrentAppUser();

  if (!currentUser) {
    redirect("/login");
  }

  if (!currentUser.mustChangePassword) {
    redirect("/dashboard");
  }

  const params =
    (await searchParams) ?? {};
  const errorMessage =
    getErrorMessage(params.error);
  const isClinicUser =
    Boolean(currentUser.clinicId);

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">
          {isClinicUser
            ? "Primeiro acesso da clínica"
            : "Primeiro acesso da plataforma"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isClinicUser
            ? "Defina uma nova senha para continuar usando o painel da clínica."
            : "Defina uma nova senha para continuar usando a área administrativa da plataforma."}
        </p>

        {errorMessage ? (
          <p className="mt-4 rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-sm">
            {errorMessage}
          </p>
        ) : null}

        <form
          action={
            completeFirstAccessPasswordAction
          }
          className="mt-6 space-y-4"
        >
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium"
            >
              Nova senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              minLength={8}
              required
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="confirmPassword"
              className="text-sm font-medium"
            >
              Confirmar senha
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              minLength={8}
              required
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            />
          </div>

          <button
            type="submit"
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Atualizar senha
          </button>
        </form>
      </div>
    </main>
  );
}

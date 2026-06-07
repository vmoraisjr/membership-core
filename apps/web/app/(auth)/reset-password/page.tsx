import Link from "next/link";

import { resetPasswordAction } from "@/features/auth/actions/reset-password";
import { getTranslations } from "@/i18n/messages";

type Props = {
  searchParams?: Promise<{
    token?: string;
    error?: string;
  }>;
};

function getErrorMessage(
  t: ReturnType<typeof getTranslations>,
  error?: string
) {
  switch (error) {
    case "password_too_short":
      return t(
        "auth.resetPassword.passwordTooShort"
      );
    case "password_mismatch":
      return t(
        "auth.resetPassword.passwordMismatch"
      );
    case "invalid_token":
      return t(
        "auth.resetPassword.invalidToken"
      );
    default:
      return null;
  }
}

export default async function ResetPasswordPage({
  searchParams,
}: Props) {
  const t = getTranslations();
  const params =
    (await searchParams) ?? {};
  const errorMessage =
    getErrorMessage(
      t,
      params.error
    );

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("auth.resetPassword.title")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("auth.resetPassword.description")}
        </p>

        {errorMessage ? (
          <p className="mt-4 rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-sm">
            {errorMessage}
          </p>
        ) : null}

        <form
          action={resetPasswordAction}
          className="mt-6 space-y-4"
        >
          <div className="space-y-2">
            <label
              htmlFor="token"
              className="text-sm font-medium"
            >
              {t("auth.resetPassword.tokenLabel")}
            </label>
            <input
              id="token"
              name="token"
              type="text"
              defaultValue={
                params.token ?? ""
              }
              required
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium"
            >
              {t("auth.resetPassword.newPassword")}
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
              {t(
                "auth.resetPassword.confirmPassword"
              )}
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
            {t("shared.actions.updatePassword")}
          </button>
        </form>

        <Link
          href="/login"
          className="mt-4 inline-block text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          {t("shared.actions.backToLogin")}
        </Link>
      </div>
    </main>
  );
}

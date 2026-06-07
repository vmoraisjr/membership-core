import Link from "next/link";

import { requestPasswordResetAction } from "@/features/auth/actions/request-password-reset";
import { getTranslations } from "@/i18n/messages";

type Props = {
  searchParams?: Promise<{
    status?: string;
  }>;
};

export default async function ForgotPasswordPage({
  searchParams,
}: Props) {
  const t = getTranslations();
  const params =
    (await searchParams) ?? {};

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("auth.forgotPassword.title")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("auth.forgotPassword.description")}
        </p>

        {params.status === "sent" ? (
          <p className="mt-4 rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-sm">
            {t("auth.forgotPassword.success")}
          </p>
        ) : null}

        <form
          action={requestPasswordResetAction}
          className="mt-6 space-y-4"
        >
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            />
          </div>

          <button
            type="submit"
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            {t("auth.forgotPassword.submit")}
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

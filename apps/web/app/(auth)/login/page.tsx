import Link from "next/link";
import { redirect } from "next/navigation";

import { loginAction } from "@/features/auth/actions/login";
import {
  ensureDefaultAppUsers,
  getCurrentAppUser,
  getDefaultAuthPassword,
  isDefaultAuthBootstrapEnabled,
} from "@/features/auth/services/get-current-app-user";
import { getRoleLabel } from "@/features/auth/constants/roles";
import { getTranslations } from "@/i18n/messages";

type Props = {
  searchParams?: Promise<{
    error?: string;
    next?: string;
    status?: string;
  }>;
};

function getMessage(
  t: ReturnType<typeof getTranslations>,
  error?: string,
  status?: string
) {
  if (error === "invalid_credentials") {
    return t("auth.login.invalidCredentials");
  }

  if (status === "password_reset") {
    return t("auth.login.passwordUpdated");
  }

  return null;
}

export default async function LoginPage({
  searchParams,
}: Props) {
  const t = getTranslations();
  const currentUser =
    await getCurrentAppUser();

  if (currentUser) {
    redirect("/dashboard");
  }

  const params =
    (await searchParams) ?? {};
  const users =
    await ensureDefaultAppUsers();
  const defaultPassword =
    getDefaultAuthPassword();
  const bootstrapEnabled =
    isDefaultAuthBootstrapEnabled();
  const message = getMessage(
    t,
    params.error,
    params.status
  );
  const next =
    params.next?.startsWith(
      "/dashboard"
    )
      ? params.next
      : "/dashboard";

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-sm">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("auth.login.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("auth.login.description")}
          </p>
        </div>

        {message ? (
          <p className="mt-4 rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-sm">
            {message}
          </p>
        ) : null}

        <form
          action={loginAction}
          className="mt-6 space-y-4"
        >
          <input
            type="hidden"
            name="next"
            value={next}
          />

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
              required
              minLength={8}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            />
          </div>

          <button
            type="submit"
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            {t("shared.actions.signIn")}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between text-sm">
          <Link
            href="/forgot-password"
            className="text-muted-foreground underline-offset-4 hover:underline"
          >
            {t("auth.login.forgotPassword")}
          </Link>
        </div>

        {bootstrapEnabled &&
        users.length > 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-border/60 bg-muted/30 p-4 text-sm">
            <p className="font-medium">
              {t("auth.login.seededAccessTitle")}
            </p>
            <p className="mt-1 text-muted-foreground">
              {t(
                "auth.login.seededAccessDescription"
              )}{" "}
              <code>{defaultPassword}</code>
            </p>
            <ul className="mt-3 space-y-1 text-muted-foreground">
              {users.map((user) => (
                <li key={user.id}>
                  {user.email} -{" "}
                  {getRoleLabel(
                    user.role
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </main>
  );
}

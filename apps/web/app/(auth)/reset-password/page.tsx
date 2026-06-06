import Link from "next/link";

import { resetPasswordAction } from "@/features/auth/actions/reset-password";

type Props = {
  searchParams?: Promise<{
    token?: string;
    error?: string;
  }>;
};

function getErrorMessage(error?: string) {
  switch (error) {
    case "password_too_short":
      return "Password must be at least 8 characters.";
    case "password_mismatch":
      return "Passwords do not match.";
    case "invalid_token":
      return "The reset token is invalid or expired.";
    default:
      return null;
  }
}

export default async function ResetPasswordPage({
  searchParams,
}: Props) {
  const params =
    (await searchParams) ?? {};
  const errorMessage =
    getErrorMessage(
      params.error
    );

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">
          Reset password
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter the reset token and choose a new password.
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
              Reset token
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
              New password
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
              Confirm password
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
            Update password
          </button>
        </form>

        <Link
          href="/login"
          className="mt-4 inline-block text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          Back to login
        </Link>
      </div>
    </main>
  );
}

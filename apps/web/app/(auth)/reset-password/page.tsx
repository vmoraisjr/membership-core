import Link from "next/link";

import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { AuthCard } from "@/features/auth/components/auth-card";
import { AuthSubmitButton } from "@/features/auth/components/auth-submit-button";
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
      return t("auth.resetPassword.passwordTooShort");
    case "password_mismatch":
      return t("auth.resetPassword.passwordMismatch");
    case "invalid_token":
      return t("auth.resetPassword.invalidToken");
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
  const errorMessage = getErrorMessage(
    t,
    params.error
  );

  return (
    <AuthCard
      title={t("auth.resetPassword.title")}
      description={t("auth.resetPassword.description")}
      message={errorMessage}
      messageTone="danger"
      footer={
        <Link
          href="/login"
          className="font-medium text-muted-foreground underline-offset-4 transition hover:text-foreground hover:underline"
        >
          {t("shared.actions.backToLogin")}
        </Link>
      }
    >
      <form
        action={resetPasswordAction}
        className="space-y-5"
      >
        <Field
          htmlFor="token"
          label={t("auth.resetPassword.tokenLabel")}
        >
          <Input
            id="token"
            name="token"
            type="text"
            defaultValue={params.token ?? ""}
            required
          />
        </Field>

        <Field
          htmlFor="password"
          label={t("auth.resetPassword.newPassword")}
        >
          <PasswordInput
            id="password"
            name="password"
            minLength={8}
            required
            autoComplete="new-password"
            hideLabel={t("auth.login.hidePassword")}
            showLabel={t("auth.login.showPassword")}
          />
        </Field>

        <Field
          htmlFor="confirmPassword"
          label={t("auth.resetPassword.confirmPassword")}
        >
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            minLength={8}
            required
            autoComplete="new-password"
            hideLabel={t("auth.login.hidePassword")}
            showLabel={t("auth.login.showPassword")}
          />
        </Field>

        <AuthSubmitButton
          label={t("shared.actions.updatePassword")}
        />
      </form>
    </AuthCard>
  );
}

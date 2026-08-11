import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { AuthCard } from "@/features/auth/components/auth-card";
import { AuthSubmitButton } from "@/features/auth/components/auth-submit-button";
import { acceptUserInviteAction } from "@/features/auth/actions/accept-user-invite";
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
    case "missing_name":
      return t("auth.invite.missingName");
    case "password_too_short":
      return t("auth.invite.passwordTooShort");
    case "password_mismatch":
      return t("auth.invite.passwordMismatch");
    case "invalid_token":
      return t("auth.invite.invalidToken");
    default:
      return null;
  }
}

export default async function InvitePage({
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
      title={t("auth.invite.title")}
      description={t("auth.invite.description")}
      message={errorMessage}
      messageTone="danger"
    >
      <form
        action={acceptUserInviteAction}
        className="space-y-5"
      >
        <Field
          htmlFor="token"
          label={t("auth.invite.tokenLabel")}
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
          htmlFor="name"
          label={t("shared.labels.fullName")}
        >
          <Input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="name"
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
          label={t("auth.invite.activateAccount")}
        />
      </form>
    </AuthCard>
  );
}

import { redirect } from "next/navigation";

import { Field } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { AuthCard } from "@/features/auth/components/auth-card";
import { AuthSubmitButton } from "@/features/auth/components/auth-submit-button";
import { completeFirstAccessPasswordAction } from "@/features/auth/actions/complete-first-access-password";
import { getCurrentAppUser } from "@/features/auth/services/get-current-app-user";
import { getTranslations } from "@/i18n/messages";

type Props = {
  searchParams?: Promise<{
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
    default:
      return null;
  }
}

export default async function FirstAccessPage({
  searchParams,
}: Props) {
  const t = getTranslations();
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
    getErrorMessage(t, params.error);
  const isClinicUser =
    Boolean(currentUser.clinicId);

  return (
    <AuthCard
      title={
        isClinicUser
          ? t("auth.firstAccess.titleClinic")
          : t("auth.firstAccess.titlePlatform")
      }
      description={
        isClinicUser
          ? t("auth.firstAccess.descriptionClinic")
          : t("auth.firstAccess.descriptionPlatform")
      }
      message={errorMessage}
      messageTone="danger"
    >
      <form
        action={completeFirstAccessPasswordAction}
        className="space-y-5"
      >
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
          label={t("auth.firstAccess.submit")}
        />
      </form>
    </AuthCard>
  );
}

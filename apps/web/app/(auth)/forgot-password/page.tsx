import Link from "next/link";

import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { AuthCard } from "@/features/auth/components/auth-card";
import { AuthSubmitButton } from "@/features/auth/components/auth-submit-button";
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
  const sent = params.status === "sent";

  return (
    <AuthCard
      title={t("auth.forgotPassword.title")}
      description={t("auth.forgotPassword.description")}
      message={
        sent ? t("auth.forgotPassword.success") : null
      }
      messageTone="success"
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
        action={requestPasswordResetAction}
        className="space-y-5"
      >
        <Field
          htmlFor="email"
          label={t("shared.labels.email")}
        >
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
          />
        </Field>

        <AuthSubmitButton
          label={t("auth.forgotPassword.submit")}
        />
      </form>
    </AuthCard>
  );
}

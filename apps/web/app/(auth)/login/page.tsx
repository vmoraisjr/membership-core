import Image from "next/image";
import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import {
  ensureDefaultAppUsers,
  getCurrentAppUser,
  getDefaultAuthPassword,
  isDefaultAuthBootstrapEnabled,
} from "@/features/auth/services/get-current-app-user";
import { getRoleLabel } from "@/features/auth/constants/roles";
import { LoginForm } from "@/features/auth/components/login-form";
import { getTranslations } from "@/i18n/messages";
import {
  SHEEP_LOCKUP_PATH,
} from "@/lib/branding";

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
    redirect(
      currentUser.mustChangePassword
        ? "/first-access"
        : "/dashboard"
    );
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
  const showSeededAccess =
    process.env.NODE_ENV !==
      "production" &&
    bootstrapEnabled &&
    users.length > 0;
  const benefits = [
    t(
      "auth.login.benefits.organizedRevenue"
    ),
    t(
      "auth.login.benefits.noTraining"
    ),
    t(
      "auth.login.benefits.readyToGrow"
    ),
  ];

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top,rgba(47,111,237,0.12),transparent_68%)]" />

      <section className="relative grid w-full max-w-[64rem] overflow-hidden rounded-[2rem] border border-white/70 bg-[rgba(255,255,255,0.9)] shadow-[var(--shadow-lg)] backdrop-blur-xl lg:grid-cols-[1.08fr_0.92fr]">
        <div className="border-b border-border/60 bg-white px-6 py-8 sm:px-8 sm:py-10 lg:flex lg:min-h-[72vh] lg:flex-col lg:justify-center lg:border-r lg:border-b-0 lg:px-10 lg:py-12">
          <div className="flex min-h-[20vh] items-center justify-center">
            <Image
              src={SHEEP_LOCKUP_PATH}
              alt="Sheep"
              width={320}
              height={86}
              priority
              className="h-auto  w-auto max-w-[18rem] object-contain sm:max-w-[20rem] lg:max-w-[22rem]"
            />
          </div>

          {/* <p className="mt-5 text-center text-sm leading-6 text-muted-foreground lg:mt-6">
            {t("auth.login.brandSubtitle")}
          </p> */}
          
          <div className="mt-8 max-w-xl space-y-4 lg:mx-auto">
            <h1 className="text-balance text-center text-[1.2rem] leading-tight font-semibold tracking-[-0.03em] text-foreground sm:text-[1.95rem] lg:text-[2.15rem]">
              {t("auth.login.headline")}
            </h1>
            <p className="max-w-lg text-pretty text-center text-sm leading-7 text-muted-foreground sm:text-[0.97rem]">
              {t("auth.login.subtitle")}h
            </p>
          </div>

          <ul className="mt-8 space-y-4 lg:mx-auto lg:max-w-lg">
            {benefits.map((benefit) => (
              <li
                key={benefit}
                className="flex items-center gap-3 text-sm font-medium text-foreground sm:text-[0.96rem]"
              >
                <CheckCircle2 className="size-4 shrink-0 text-primary" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-[rgba(244,247,251,0.94)] px-6 py-6 sm:px-8 sm:py-8 lg:flex lg:flex-col lg:justify-between lg:px-10 lg:py-10">
          <div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold tracking-[-0.02em] text-foreground">
                {t("auth.login.enterTitle")}
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                {t("auth.login.enterDescription")}
              </p>
            </div>

            {message ? (
              <p className="mt-5 rounded-2xl border border-border/60 bg-muted/40 px-4 py-3 text-sm">
                {message}
              </p>
            ) : null}

            <div className="mt-6">
              <LoginForm next={next} />
            </div>

            {showSeededAccess ? (
              <details className="mt-6 rounded-2xl border border-dashed border-border/70 bg-muted/20 p-4 text-sm">
                <summary className="cursor-pointer list-none font-medium text-foreground marker:hidden">
                  {t("auth.login.seededAccessTitle")}
                </summary>
                <p className="mt-3 text-muted-foreground">
                  {t(
                    "auth.login.seededAccessDescription"
                  )}{" "}
                  <code>{defaultPassword}</code>
                </p>
                <ul className="mt-3 space-y-1.5 text-muted-foreground">
                  {users.map((user) => (
                    <li key={user.id}>
                      {user.email} -{" "}
                      {getRoleLabel(
                        user.role
                      )}
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
          </div>

          <p className="mt-8 text-right text-xs text-muted-foreground lg:mt-8">
            {t("auth.login.footer")}
          </p>
        </div>
      </section>
    </main>
  );
}

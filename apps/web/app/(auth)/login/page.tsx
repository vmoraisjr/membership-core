import Link from "next/link";
import { redirect } from "next/navigation";

import { BrandMark } from "@/components/branding/brand-mark";
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
  SHEEP_BRAND_NAME,
  SHEEP_BRAND_SUBTITLE,
  SHEEP_LOGO_PATH,
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

  return (
    <main className="flex min-h-full items-center justify-center p-6">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(255,248,238,0.96))] p-8 shadow-sm">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(205,146,83,0.22),transparent_68%)]" />
          <div className="relative space-y-8">
            <BrandMark
              brand={{
                displayName:
                  SHEEP_BRAND_NAME,
                subtitle:
                  SHEEP_BRAND_SUBTITLE,
                logoUrl:
                  SHEEP_LOGO_PATH,
              }}
            />
            <div className="max-w-xl space-y-4">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                Plataforma de assinatura e fidelidade
              </p>
              <h1 className="text-4xl font-semibold tracking-tight text-foreground">
                Sheep organiza a operação comercial de empresas com receita recorrente.
              </h1>
              <p className="text-base text-muted-foreground">
                Entre como administração da plataforma ou como empresa cliente
                para gerir assinaturas, cobrança, usuários, benefícios e
                relacionamento contínuo.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                "Governança da plataforma e das contas clientes",
                "Operação local com clientes, planos e pagamentos",
                "Identidade da empresa preservada com assinatura Sheep",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-border/60 bg-background/70 p-4 text-sm text-muted-foreground"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="w-full rounded-[2rem] border border-border/70 bg-background/95 p-6 shadow-sm">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              {t("auth.login.title")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("auth.login.description")}
            </p>
          </div>

          {message ? (
            <p className="mt-4 rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-sm">
              {message}
            </p>
          ) : null}

          <LoginForm next={next} />

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
      </div>
    </main>
  );
}

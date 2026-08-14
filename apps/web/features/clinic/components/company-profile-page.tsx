import Link from "next/link";

import { DashboardPage } from "@/components/layout/dashboard-page";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { getCurrentUserRole } from "@/features/auth/services/get-current-user-role";
import { AccessDenied } from "@/features/rbac/components/access-denied";
import { hasPermission } from "@/features/rbac/permissions";
import {
  formatBrazilianCnpj,
  formatBrazilianPhone,
  formatBrazilianState,
  formatBrazilianZipCode,
} from "@/lib/br-formats";
import { minhaEmpresaUrl } from "@/lib/company-routes";

import { CompanyBrandingForm } from "./company-branding-form";
import { CompanySubscriptionTab } from "./company-subscription-tab";
import { MyCompanyTabs } from "./my-company-tabs";
import { getCurrentClinicProfile } from "../services/get-current-clinic-profile";

function formatDate(
  value: Date | null | undefined
) {
  if (!value) {
    return "Não informado";
  }

  return new Date(value).toLocaleDateString();
}

type Props = {
  activeTab?: "profile" | "subscription";
  checkoutReturn?: "success" | "canceled";
};

export async function CompanyProfilePage({
  activeTab = "profile",
  checkoutReturn,
}: Props = {}) {
  const role =
    await getCurrentUserRole();

  if (
    !hasPermission(
      role,
      "clinic",
      "view"
    )
  ) {
    return (
      <DashboardPage>
        <AccessDenied
          title="Acesso à empresa negado"
          description="O perfil atual não pode visualizar os dados da empresa."
        />
      </DashboardPage>
    );
  }

  const clinic =
    await getCurrentClinicProfile();
  const latestSubscription =
    clinic.clinicSubscriptions[0] ??
    null;
  const clinicMaster =
    clinic.appUsers[0] ?? null;

  return (
    <DashboardPage>
      <PageHeader
        eyebrow="Administração da empresa"
        title="Minha empresa"
        description="Consulte os dados da empresa, ajuste a identidade visual local e use chamados para alterações cadastrais sensíveis."
        meta={
          <>
            <span>{clinic.email}</span>
            <span>•</span>
            <span>
              {clinic.city}, {clinic.state}
            </span>
          </>
        }
      />

      <MyCompanyTabs
        activeTab={activeTab}
        role={role}
      />

      {activeTab === "subscription" ? (
        <CompanySubscriptionTab
          checkoutReturn={checkoutReturn}
        />
      ) : null}

      {activeTab === "profile" ? (
      <>
      <div className="page-section-grid xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <SectionCard
          title="Identidade da empresa"
          description="Ajuste o nome de exibição e o logo que aparecem no workspace local."
        >
          <div className="p-5 md:p-6">
            <CompanyBrandingForm
              brandName={
                clinic.brandName
              }
              logoUrl={clinic.logoUrl}
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Governança cadastral"
          description="Alterações fiscais, de contato principal e de endereço precisam de abertura de chamado."
        >
          <div className="form-shell-body space-y-4">
            <p className="text-sm leading-6 text-muted-foreground">
              Isso evita divergência com cobrança, contrato, titularidade e
              demais obrigações legais.
            </p>
            <Link
              href={minhaEmpresaUrl({
                tab: "support",
                category: "REGISTRATION",
              })}
              className="inline-flex h-10 items-center rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-[color:var(--color-surface-subtle)]"
            >
              Abrir chamado cadastral
            </Link>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="Dados cadastrais"
          description="Consulta somente leitura dos dados principais da empresa."
        >
          <div className="grid gap-4 p-5 md:grid-cols-2 md:p-6">
            <div className="detail-field">
              <p className="detail-field-label">
                Razão social
              </p>
              <p className="detail-field-value">
                {clinic.name}
              </p>
            </div>
            <div className="detail-field">
              <p className="detail-field-label">
                Nome de exibição
              </p>
              <p className="detail-field-value">
                {clinic.brandName ??
                  "Não definido"}
              </p>
            </div>
            <div className="detail-field">
              <p className="detail-field-label">
                Documento
              </p>
              <p className="detail-field-value">
                {formatBrazilianCnpj(
                  clinic.document
                )}
              </p>
            </div>
            <div className="detail-field">
              <p className="detail-field-label">
                E-mail principal
              </p>
              <p className="detail-field-value break-all">
                {clinic.email}
              </p>
            </div>
            <div className="detail-field">
              <p className="detail-field-label">
                Telefone
              </p>
              <p className="detail-field-value">
                {formatBrazilianPhone(
                  clinic.phone
                )}
              </p>
            </div>
            <div className="detail-field">
              <p className="detail-field-label">
                Slug
              </p>
              <p className="detail-field-value">
                {clinic.slug}
              </p>
            </div>
            <div className="detail-field md:col-span-2">
              <p className="detail-field-label">
                Endereço
              </p>
              <p className="detail-field-value">
                {clinic.address}, {clinic.city} - {formatBrazilianState(clinic.state)}, {formatBrazilianZipCode(clinic.zipCode)}
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Master e assinatura"
          description="Resumo do usuário principal e da assinatura SaaS da empresa."
        >
          <div className="grid gap-4 p-5 md:p-6">
            <div className="detail-field">
              <p className="detail-field-label">
                Master da empresa
              </p>
              <p className="detail-field-value">
                {clinicMaster?.name ??
                  "Não informado"}
              </p>
              <p className="text-sm text-muted-foreground">
                {clinicMaster?.email ??
                  "Sem e-mail"}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                Último acesso:{" "}
                {formatDate(
                  clinicMaster?.lastLoginAt
                )}{" "}
                · Troca obrigatória:{" "}
                {clinicMaster?.mustChangePassword
                  ? "Sim"
                  : "Não"}
              </p>
            </div>

            <div className="detail-field">
              <p className="detail-field-label">
                Plano SaaS
              </p>
              <p className="detail-field-value">
                {latestSubscription
                  ?.clinicBillingPlan.name ??
                  "Não definido"}
              </p>
              <p className="text-sm text-muted-foreground">
                Status:{" "}
                {latestSubscription?.status ??
                  "Não definido"}
              </p>
              <Link
                href={minhaEmpresaUrl({
                  tab: "subscription",
                })}
                className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
              >
                Ver assinatura e cobrança →
              </Link>
            </div>
          </div>
        </SectionCard>
      </div>
      </>
      ) : null}
    </DashboardPage>
  );
}

import {
  ModuleKey,
  ModuleStatus,
} from "@prisma/client";

import { DashboardPage } from "@/components/layout/dashboard-page";
import { ClinicAssignmentRequired } from "@/components/dashboard/clinic-assignment-required";
import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { AccessDenied } from "@/features/rbac/components/access-denied";
import { getCurrentAppUser } from "@/features/auth/services/get-current-app-user";
import { getCurrentUserRole } from "@/features/auth/services/get-current-user-role";
import { getBillingOverview } from "@/features/billing/services/billing-foundation";
import { hasPermission } from "@/features/rbac/permissions";
import { getTranslations } from "@/i18n/messages";
import { formatCurrency } from "@/lib/formatters";

import { PlatformSubscriptionSection } from "@/features/billing/components/platform-subscription-section";

import { disableClinicModuleAction } from "../actions/disable-clinic-module";
import { enableClinicModuleAction } from "../actions/enable-clinic-module";
import { saveClinicBillingPlanAction } from "../actions/save-clinic-billing-plan";
import { getClinicModules } from "../services/module-access";
import { getPlatformModulesOverview } from "../services/get-platform-modules-overview";
import { isModuleV1Active } from "../services/module-policy";

function getModuleScopeLabel(
  key: ModuleKey
) {
  return isModuleV1Active(key)
    ? "Disponivel na operacao atual"
    : "Reservado para expansoes futuras";
}

export async function ModulesPage() {
  const t = getTranslations();
  const [role, currentUser] =
    await Promise.all([
      getCurrentUserRole(),
      getCurrentAppUser(),
    ]);

  if (
    !hasPermission(
      role,
      "modules",
      "view"
    )
  ) {
    return (
      <DashboardPage>
        <AccessDenied
          title={t(
            "modules.accessDeniedTitle"
          )}
          description={t(
            "modules.accessDeniedDescription"
          )}
        />
      </DashboardPage>
    );
  }

  if (!currentUser?.clinicId) {
    if (
      currentUser?.role !== "OWNER" &&
      currentUser?.role !== "ADMIN"
    ) {
      return (
        <DashboardPage>
          <ClinicAssignmentRequired />
        </DashboardPage>
      );
    }

    const overview =
      await getPlatformModulesOverview();

    return (
      <DashboardPage>
        <PageHeader
          title="Modulos e planos da plataforma"
          description="Gerencie os planos comerciais, as regras de liberacao de modulos e a cobertura entregue para as clinicas."
        />

        <div className="grid gap-4 md:grid-cols-4">
          <SectionCard
            title="Planos comerciais"
            description="Quantidade de planos SaaS cadastrados."
          >
            <div className="p-4 text-3xl font-semibold">
              {
                overview.billingPlans
                  .length
              }
            </div>
          </SectionCard>
          <SectionCard
            title="Planos ativos"
            description="Planos disponiveis para novas assinaturas."
          >
            <div className="p-4 text-3xl font-semibold">
              {
                overview.billingPlans.filter(
                  (plan) => plan.active
                ).length
              }
            </div>
          </SectionCard>
          <SectionCard
            title="Clinicas cobertas"
            description="Assinaturas vinculadas aos planos comerciais."
          >
            <div className="p-4 text-3xl font-semibold">
              {overview.billingPlans.reduce(
                (total, plan) =>
                  total +
                  plan.metrics.clinicCount,
                0
              )}
            </div>
          </SectionCard>
          <SectionCard
            title="Modulos V1"
            description="Modulos operacionais liberados hoje."
          >
            <div className="p-4 text-3xl font-semibold">
              {
                overview.modules.filter(
                  (module) =>
                    module.isV1Active
                ).length
              }
            </div>
          </SectionCard>
        </div>

        <SectionCard
          title="Novo plano comercial"
          description="Cadastre um plano da plataforma com precificacao e janela de trial."
        >
          <form
            action={saveClinicBillingPlanAction}
            className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-6"
          >
            <input
              type="hidden"
              name="planId"
              value=""
            />
            <label className="grid gap-2 text-sm xl:col-span-2">
              <span className="font-medium">
                Nome
              </span>
              <input
                name="name"
                required
                className="h-10 rounded-md border px-3"
                placeholder="Plano SaaS"
              />
            </label>
            <label className="grid gap-2 text-sm xl:col-span-2">
              <span className="font-medium">
                Descricao
              </span>
              <input
                name="description"
                className="h-10 rounded-md border px-3"
                placeholder="Resumo comercial"
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="font-medium">
                Mensal
              </span>
              <input
                name="monthlyPrice"
                type="number"
                step="0.01"
                className="h-10 rounded-md border px-3"
                placeholder="249"
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="font-medium">
                Anual
              </span>
              <input
                name="annualPrice"
                type="number"
                step="0.01"
                className="h-10 rounded-md border px-3"
                placeholder="2490"
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="font-medium">
                Trial
              </span>
              <input
                name="trialDays"
                type="number"
                min="0"
                defaultValue="14"
                className="h-10 rounded-md border px-3"
              />
            </label>
            <label className="flex items-center gap-2 text-sm xl:col-span-1">
              <input
                type="checkbox"
                name="active"
                defaultChecked
              />
              Plano ativo
            </label>
            <div className="xl:col-span-6">
              <button
                type="submit"
                className="rounded-md border px-3 py-2 text-sm"
              >
                Salvar plano
              </button>
            </div>
          </form>
        </SectionCard>

        <SectionCard
          title="Planos e regras de uso"
          description="Edite precos, vigencia de trial e disponibilidade comercial de cada plano."
        >
          <div className="space-y-4 p-4">
            {overview.billingPlans.map(
              (plan) => (
                <form
                  key={plan.id}
                  action={saveClinicBillingPlanAction}
                  className="grid gap-4 rounded-xl border p-4 md:grid-cols-2 xl:grid-cols-6"
                >
                  <input
                    type="hidden"
                    name="planId"
                    value={plan.id}
                  />
                  <label className="grid gap-2 text-sm xl:col-span-2">
                    <span className="font-medium">
                      Nome
                    </span>
                    <input
                      name="name"
                      defaultValue={plan.name}
                      required
                      className="h-10 rounded-md border px-3"
                    />
                  </label>
                  <label className="grid gap-2 text-sm xl:col-span-2">
                    <span className="font-medium">
                      Descricao
                    </span>
                    <input
                      name="description"
                      defaultValue={
                        plan.description ??
                        ""
                      }
                      className="h-10 rounded-md border px-3"
                    />
                  </label>
                  <label className="grid gap-2 text-sm">
                    <span className="font-medium">
                      Mensal
                    </span>
                    <input
                      name="monthlyPrice"
                      type="number"
                      step="0.01"
                      defaultValue={
                        plan.monthlyPrice ??
                        ""
                      }
                      className="h-10 rounded-md border px-3"
                    />
                  </label>
                  <label className="grid gap-2 text-sm">
                    <span className="font-medium">
                      Anual
                    </span>
                    <input
                      name="annualPrice"
                      type="number"
                      step="0.01"
                      defaultValue={
                        plan.annualPrice ??
                        ""
                      }
                      className="h-10 rounded-md border px-3"
                    />
                  </label>
                  <label className="grid gap-2 text-sm">
                    <span className="font-medium">
                      Trial
                    </span>
                    <input
                      name="trialDays"
                      type="number"
                      min="0"
                      defaultValue={
                        plan.trialDays
                      }
                      className="h-10 rounded-md border px-3"
                    />
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="active"
                      defaultChecked={
                        plan.active
                      }
                    />
                    Plano ativo
                  </label>
                  <div className="grid gap-1 text-xs text-muted-foreground xl:col-span-3">
                    <span>
                      Clinicas vinculadas:{" "}
                      {
                        plan.metrics
                          .clinicCount
                      }
                    </span>
                    <span>
                      Assinaturas operacionais:{" "}
                      {
                        plan.metrics
                          .activeSubscriptionCount
                      }
                    </span>
                    <span>
                      Receita base mensal:{" "}
                      {formatCurrency(
                        plan.monthlyPrice ??
                          0
                      )}
                    </span>
                  </div>
                  <div className="flex items-end xl:col-span-3 xl:justify-end">
                    <button
                      type="submit"
                      className="rounded-md border px-3 py-2 text-sm"
                    >
                      Atualizar plano
                    </button>
                  </div>
                </form>
              )
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Catalogo de modulos"
          description="Acompanhe quais modulos estao liberados na versao atual e quais permanecem em roadmap."
        >
          <div className="overflow-x-auto p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2">Modulo</th>
                  <th className="py-2">Chave</th>
                  <th className="py-2">Status V1</th>
                  <th className="py-2">Regra</th>
                </tr>
              </thead>
              <tbody>
                {overview.modules.map(
                  (module) => (
                    <tr
                      key={module.id}
                      className="border-b"
                    >
                      <td className="py-3">
                        <div className="font-medium">
                          {module.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {
                            module.description
                          }
                        </div>
                      </td>
                      <td className="py-3">
                        {module.key}
                      </td>
                      <td className="py-3">
                        {module.isV1Active
                          ? "Ativo"
                          : "Futuro"}
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {getModuleScopeLabel(
                          module.key
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard
          title="Cobertura por plano"
          description="Os planos comerciais herdam a politica global de modulos liberados na plataforma."
        >
          <div className="overflow-x-auto p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2">Plano</th>
                  {overview.modules.map(
                    (module) => (
                      <th
                        key={module.id}
                        className="py-2"
                      >
                        {module.name}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {overview.billingPlans.map(
                  (plan) => (
                    <tr
                      key={plan.id}
                      className="border-b"
                    >
                      <td className="py-3 font-medium">
                        {plan.name}
                      </td>
                      {overview.modules.map(
                        (module) => (
                          <td
                            key={
                              module.id
                            }
                            className="py-3"
                          >
                            {module.isV1Active
                              ? "Incluido"
                              : "Futuro"}
                          </td>
                        )
                      )}
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </DashboardPage>
    );
  }

  const [clinicModules, billingOverview] =
    await Promise.all([
      getClinicModules(),
      getBillingOverview(),
    ]);
  const canManageModules =
    hasPermission(
      role,
      "modules",
      "manage"
    );

  return (
    <DashboardPage>
      <PageHeader
        title={t("modules.title")}
        description="Gerencie os módulos da clínica e acompanhe a assinatura comercial da plataforma nesta área administrativa."
      />

      <PlatformSubscriptionSection
        overview={billingOverview}
      />

      <SectionCard
        title={t("modules.clinicModulesTitle")}
        description={t("modules.clinicModulesDescription")}
      >
        <div className="overflow-x-auto p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">
                  {t("modules.module")}
                </th>
                <th className="py-2">
                  {t("shared.labels.status")}
                </th>
                <th className="py-2">
                  V1
                </th>
                <th className="py-2 text-right">
                  {t("shared.labels.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {clinicModules.map(
                (clinicModule) => (
                  <tr
                    key={clinicModule.id}
                    className="border-b"
                  >
                    <td className="py-3">
                      <div className="font-medium">
                        {
                          clinicModule
                            .module.name
                        }
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {
                          clinicModule
                            .module
                            .description
                        }
                      </div>
                    </td>
                    <td className="py-3">
                      {clinicModule.status ===
                      ModuleStatus.ENABLED
                        ? t("shared.states.active")
                        : t("shared.states.inactive")}
                    </td>
                    <td className="py-3">
                      {isModuleV1Active(
                        clinicModule.module.key
                      )
                        ? t("shared.states.active")
                        : t("modules.future")}
                    </td>
                    <td className="py-3 text-right">
                      {!canManageModules ||
                      clinicModule.module.key ===
                        ModuleKey.MEMBERSHIP ? (
                        <span className="text-xs text-muted-foreground">
                          {clinicModule.module
                            .key ===
                          ModuleKey.MEMBERSHIP
                            ? t("modules.coreModule")
                            : t("shared.states.readOnly")}
                        </span>
                      ) : !isModuleV1Active(
                          clinicModule.module.key
                        ) ? (
                        <span className="text-xs text-muted-foreground">
                          {t("modules.v2Only")}
                        </span>
                      ) : clinicModule.status ===
                        ModuleStatus.ENABLED ? (
                        <form
                          action={
                            disableClinicModuleAction
                          }
                          id={`disable-module-${clinicModule.id}`}
                          className="inline-flex"
                        >
                          <input
                            type="hidden"
                            name="moduleKey"
                            value={
                              clinicModule
                                .module.key
                            }
                          />
                          <ConfirmSubmitButton
                            formId={`disable-module-${clinicModule.id}`}
                            title={t("modules.disableTitle")}
                            description={t("modules.disableDescription", { name: clinicModule.module.name })}
                            actionLabel={t("modules.disableAction")}
                            label={t("shared.actions.disable")}
                          />
                        </form>
                      ) : (
                        <form
                          action={
                            enableClinicModuleAction
                          }
                          id={`enable-module-${clinicModule.id}`}
                          className="inline-flex"
                        >
                          <input
                            type="hidden"
                            name="moduleKey"
                            value={
                              clinicModule
                                .module.key
                            }
                          />
                          <ConfirmSubmitButton
                            formId={`enable-module-${clinicModule.id}`}
                            title={t("modules.enableTitle")}
                            description={t("modules.enableDescription", { name: clinicModule.module.name })}
                            actionLabel={t("modules.enableAction")}
                            label={t("shared.actions.enable")}
                          />
                        </form>
                      )}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </DashboardPage>
  );
}

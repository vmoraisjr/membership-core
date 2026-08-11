import {
  ModuleKey,
  ModuleStatus,
} from "@prisma/client";

import { Button } from "@/components/ui/button";
import { StatusIndicator } from "@/components/ui/status-indicator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

import { PlatformSubscriptionSection } from "@/features/billing/components/platform-subscription-section";

import { disableClinicModuleAction } from "../actions/disable-clinic-module";
import { enableClinicModuleAction } from "../actions/enable-clinic-module";
import { getClinicModules } from "../services/module-access";
import { getPlatformModulesOverview } from "../services/get-platform-modules-overview";
import { isModuleV1Active } from "../services/module-policy";
import {
  getModuleKeyDescription,
  getModuleKeyLabel,
} from "../utils/module-labels";

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
          title={t(
            "modules.platformTitle"
          )}
          description={t(
            "modules.platformDescription"
          )}
        />

        <div className="grid gap-4 md:grid-cols-4">
          <SectionCard
            title={t(
              "modules.metrics.billingPlans"
            )}
            description={t(
              "modules.metrics.billingPlansHint"
            )}
          >
            <div className="p-4 text-2xl font-semibold tabular-nums">
              {
                overview.billingPlans
                  .length
              }
            </div>
          </SectionCard>
          <SectionCard
            title={t(
              "modules.metrics.activePlans"
            )}
            description={t(
              "modules.metrics.activePlansHint"
            )}
          >
            <div className="p-4 text-2xl font-semibold tabular-nums">
              {
                overview.billingPlans.filter(
                  (plan) => plan.active
                ).length
              }
            </div>
          </SectionCard>
          <SectionCard
            title={t(
              "modules.metrics.coveredClinics"
            )}
            description={t(
              "modules.metrics.coveredClinicsHint"
            )}
          >
            <div className="p-4 text-2xl font-semibold tabular-nums">
              {overview.billingPlans.reduce(
                (total, plan) =>
                  total +
                  plan.metrics.clinicCount,
                0
              )}
            </div>
          </SectionCard>
          <SectionCard
            title={t(
              "modules.metrics.v1Modules"
            )}
            description={t(
              "modules.metrics.v1ModulesHint"
            )}
          >
            <div className="p-4 text-2xl font-semibold tabular-nums">
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
          title={t(
            "modules.plansSection.title"
          )}
          description={t(
            "modules.plansSection.description"
          )}
        >
          <div className="flex flex-col items-start gap-3 p-4">
            <p className="text-sm text-muted-foreground">
              {t(
                "modules.plansSection.count",
                {
                  count:
                    overview.billingPlans
                      .length,
                }
              )}
            </p>
            <Button asChild variant="outline">
              <a href="/dashboard/billing/catalog">
                {t(
                  "modules.plansSection.openCatalog"
                )}
              </a>
            </Button>
          </div>
        </SectionCard>

        <SectionCard
          title={t(
            "modules.catalogSection.title"
          )}
          description={t(
            "modules.catalogSection.description"
          )}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  {t(
                    "modules.catalogSection.columns.module"
                  )}
                </TableHead>
                <TableHead>
                  {t(
                    "modules.catalogSection.columns.key"
                  )}
                </TableHead>
                <TableHead>
                  {t(
                    "modules.catalogSection.columns.statusV1"
                  )}
                </TableHead>
                <TableHead>
                  {t(
                    "modules.catalogSection.columns.rule"
                  )}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overview.modules.map(
                (module) => (
                  <TableRow key={module.id}>
                    <TableCell>
                      <div className="font-medium">
                        {getModuleKeyLabel(
                          module.key
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {getModuleKeyDescription(
                          module.key
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {module.key}
                    </TableCell>
                    <TableCell>
                      <StatusIndicator
                        tone={
                          module.isV1Active
                            ? "success"
                            : "neutral"
                        }
                        label={
                          module.isV1Active
                            ? t(
                                "shared.states.active"
                              )
                            : t(
                                "modules.future"
                              )
                        }
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {module.isV1Active
                        ? t(
                            "modules.catalogSection.ruleAvailable"
                          )
                        : t(
                            "modules.catalogSection.ruleComingSoon"
                          )}
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </SectionCard>

        <SectionCard
          title={t(
            "modules.coverageSection.title"
          )}
          description={t(
            "modules.coverageSection.description"
          )}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  {t(
                    "modules.coverageSection.planColumn"
                  )}
                </TableHead>
                {overview.modules.map(
                  (module) => (
                    <TableHead
                      key={module.id}
                    >
                      {getModuleKeyLabel(
                        module.key
                      )}
                    </TableHead>
                  )
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {overview.billingPlans.map(
                (plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">
                      {plan.name}
                    </TableCell>
                    {overview.modules.map(
                      (module) => (
                        <TableCell
                          key={module.id}
                          className="text-muted-foreground"
                        >
                          {module.isV1Active
                            ? t(
                                "modules.coverageSection.included"
                              )
                            : t(
                                "modules.future"
                              )}
                        </TableCell>
                      )
                    )}
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
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
        description={t(
          "modules.clinicPageDescription"
        )}
      />

      <PlatformSubscriptionSection
        overview={billingOverview}
      />

      <SectionCard
        title={t("modules.clinicModulesTitle")}
        description={t("modules.clinicModulesDescription")}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                {t("modules.module")}
              </TableHead>
              <TableHead>
                {t("shared.labels.status")}
              </TableHead>
              <TableHead>
                {t(
                  "modules.clinicTable.availabilityColumn"
                )}
              </TableHead>
              <TableHead className="text-right">
                {t("shared.labels.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clinicModules.map(
              (clinicModule) => (
                <TableRow
                  key={clinicModule.id}
                >
                  <TableCell>
                    <div className="font-medium">
                      {getModuleKeyLabel(
                        clinicModule.module
                          .key
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {getModuleKeyDescription(
                        clinicModule.module
                          .key
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusIndicator
                      tone={
                        clinicModule.status ===
                        ModuleStatus.ENABLED
                          ? "success"
                          : "neutral"
                      }
                      label={
                        clinicModule.status ===
                        ModuleStatus.ENABLED
                          ? t(
                              "shared.states.active"
                            )
                          : t(
                              "shared.states.inactive"
                            )
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <StatusIndicator
                      tone={
                        isModuleV1Active(
                          clinicModule.module
                            .key
                        )
                          ? "success"
                          : "neutral"
                      }
                      label={
                        isModuleV1Active(
                          clinicModule.module
                            .key
                        )
                          ? t(
                              "shared.states.active"
                            )
                          : t(
                              "modules.future"
                            )
                      }
                    />
                  </TableCell>
                  <TableCell className="text-right">
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
                          description={t("modules.disableDescription", { name: getModuleKeyLabel(clinicModule.module.key) })}
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
                          description={t("modules.enableDescription", { name: getModuleKeyLabel(clinicModule.module.key) })}
                          actionLabel={t("modules.enableAction")}
                          label={t("shared.actions.enable")}
                        />
                      </form>
                    )}
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
      </SectionCard>
    </DashboardPage>
  );
}

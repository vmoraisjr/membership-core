import {
  ModuleKey,
  ModuleStatus,
} from "@prisma/client";

import { DashboardPage } from "@/components/layout/dashboard-page";
import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { AccessDenied } from "@/features/rbac/components/access-denied";
import { getCurrentUserRole } from "@/features/auth/services/get-current-user-role";
import { hasPermission } from "@/features/rbac/permissions";
import { getTranslations } from "@/i18n/messages";

import { disableClinicModuleAction } from "../actions/disable-clinic-module";
import { enableClinicModuleAction } from "../actions/enable-clinic-module";
import { getClinicModules } from "../services/module-access";
import { isModuleV1Active } from "../services/module-policy";

export async function ModulesPage() {
  const t = getTranslations();
  const role =
    await getCurrentUserRole();

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

  const clinicModules =
    await getClinicModules();
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
        description={t("modules.description")}
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

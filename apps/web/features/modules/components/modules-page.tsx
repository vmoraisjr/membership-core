import {
  ModuleKey,
  ModuleStatus,
} from "@prisma/client";

import { DashboardPage } from "@/components/layout/dashboard-page";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { AccessDenied } from "@/features/rbac/components/access-denied";
import { getCurrentUserRole } from "@/features/auth/services/get-current-user-role";
import { hasPermission } from "@/features/rbac/permissions";

import { disableClinicModuleAction } from "../actions/disable-clinic-module";
import { enableClinicModuleAction } from "../actions/enable-clinic-module";
import { getClinicModules } from "../services/module-access";

export async function ModulesPage() {
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
          title="Module management access denied"
          description="The current role cannot view commercial module settings."
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
        title="Modules"
        description="Manage the clinic's commercial module entitlements while keeping future modules dormant in V1."
      />

      <SectionCard
        title="Clinic modules"
        description="Membership stays enabled in V1; future modules can remain represented but disabled."
      >
        <div className="overflow-x-auto p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">
                  Module
                </th>
                <th className="py-2">
                  Status
                </th>
                <th className="py-2">
                  V1
                </th>
                <th className="py-2 text-right">
                  Actions
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
                      {
                        clinicModule.status
                      }
                    </td>
                    <td className="py-3">
                      {clinicModule
                        .module
                        .isV1Active
                        ? "Active"
                        : "Future"}
                    </td>
                    <td className="py-3 text-right">
                      {!canManageModules ||
                      clinicModule.module.key ===
                        ModuleKey.MEMBERSHIP ? (
                        <span className="text-xs text-muted-foreground">
                          {clinicModule.module
                            .key ===
                          ModuleKey.MEMBERSHIP
                            ? "Core module"
                            : "Read only"}
                        </span>
                      ) : clinicModule.status ===
                        ModuleStatus.ENABLED ? (
                        <form
                          action={
                            disableClinicModuleAction
                          }
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
                          <button
                            type="submit"
                            className="rounded-md border px-3 py-1.5"
                          >
                            Disable
                          </button>
                        </form>
                      ) : (
                        <form
                          action={
                            enableClinicModuleAction
                          }
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
                          <button
                            type="submit"
                            className="rounded-md border px-3 py-1.5"
                          >
                            Enable
                          </button>
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

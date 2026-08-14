import {
  Building2,
  PencilLine,
  Filter,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { DashboardPage } from "@/components/layout/dashboard-page";
import { AccessDenied } from "@/features/rbac/components/access-denied";
import { getCurrentAppUser } from "@/features/auth/services/get-current-app-user";
import { getCurrentUserRole } from "@/features/auth/services/get-current-user-role";
import { hasPermission } from "@/features/rbac/permissions";
import { getTranslations } from "@/i18n/messages";
import { formatCurrency } from "@/lib/formatters";

import { empresasUrl, planosComerciaisUrl } from "@/lib/owner-routes";
import { V1_ACTIVE_MODULE_KEYS } from "@/features/modules/services/module-policy";
import { getModuleKeyLabel } from "@/features/modules/utils/module-labels";

import { getPlatformClinicBillingOverview } from "../services/billing-foundation";
import { PlatformPlanSidePanel } from "./platform-plan-side-panel";
import {
  legendSection,
  PLAN_STATUS_LEGEND,
  MODULE_STATUS_LEGEND,
} from "@/lib/legend-content";

type Props = {
  filters: {
    query?: string;
    availability?: string;
  };
};

function matchesAvailabilityFilter(
  active: boolean,
  availability?: string
) {
  if (availability === "active") {
    return active;
  }

  if (availability === "inactive") {
    return !active;
  }

  return true;
}

export async function PlatformCommercialCatalogPage({
  filters,
}: Props) {
  const t = getTranslations();
  const [role, currentUser] =
    await Promise.all([
      getCurrentUserRole(),
      getCurrentAppUser(),
    ]);

  if (
    !hasPermission(
      role,
      "billing",
      "view"
    )
  ) {
    return (
      <DashboardPage>
        <AccessDenied
          title={t("billing.accessDeniedTitle")}
          description={t("billing.accessDeniedDescription")}
        />
      </DashboardPage>
    );
  }

  if (
    currentUser?.clinicId ||
    (currentUser?.role !== "OWNER" &&
      currentUser?.role !== "ADMIN")
  ) {
    return (
      <DashboardPage>
        <AccessDenied
          title="Área exclusiva da plataforma"
          description="O catálogo comercial Sheep é administrado apenas por owner e administrador da plataforma."
        />
      </DashboardPage>
    );
  }

  const overview =
    await getPlatformClinicBillingOverview();
  const normalizedQuery =
    filters.query?.trim().toLowerCase() ??
    "";

  const filteredPlans =
    overview.allPlans.filter((plan) => {
      if (
        normalizedQuery &&
        ![
          plan.name,
          plan.description ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery)
      ) {
        return false;
      }

      return matchesAvailabilityFilter(
        plan.active,
        filters.availability
      );
    });

  const v1ActiveModuleLabels =
    V1_ACTIVE_MODULE_KEYS.map((key) =>
      getModuleKeyLabel(key)
    ).join(", ");

  return (
    <DashboardPage>
      <PageHeader
        eyebrow="Comercial Sheep"
        title={t(
          "billing.catalogPage.title"
        )}
        description={t(
          "billing.catalogPage.description"
        )}
        action={<PlatformPlanSidePanel />}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <SectionCard
          title={t(
            "billing.catalogPage.metrics.registered"
          )}
          description={t(
            "billing.catalogPage.metrics.registeredHint"
          )}
        >
          <div className="p-4 text-2xl font-semibold tabular-nums">
            {overview.allPlans.length}
          </div>
        </SectionCard>
        <SectionCard
          title={t(
            "billing.catalogPage.metrics.sellable"
          )}
          description={t(
            "billing.catalogPage.metrics.sellableHint"
          )}
        >
          <div className="p-4 text-2xl font-semibold tabular-nums">
            {
              overview.allPlans.filter(
                (plan) => plan.active
              ).length
            }
          </div>
        </SectionCard>
        <SectionCard
          title={t(
            "billing.catalogPage.metrics.coveredClients"
          )}
          description={t(
            "billing.catalogPage.metrics.coveredClientsHint"
          )}
        >
          <div className="p-4 text-2xl font-semibold tabular-nums">
            {overview.clinicSubscriptions.length}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title={t(
          "billing.catalogPage.metrics.registered"
        )}
        description="Filtre, revise e ajuste rapidamente o catálogo comercial antes de aplicar um plano em clientes."
        helpLegend={[
          legendSection(
            "Status do plano comercial",
            PLAN_STATUS_LEGEND
          ),
          legendSection(
            "Status do módulo",
            MODULE_STATUS_LEGEND
          ),
        ]}
      >
        <form
          method="get"
          className="grid gap-4 border-b p-5 md:grid-cols-[minmax(0,1fr)_220px_auto]"
        >
          <label className="grid gap-2 text-sm">
            <span className="font-medium">
              {t(
                "billing.catalogPage.filters.searchLabel"
              )}
            </span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="query"
                defaultValue={
                  filters.query ?? ""
                }
                placeholder={t(
                  "billing.catalogPage.filters.searchPlaceholder"
                )}
                className="pl-9"
              />
            </div>
          </label>

          <label className="grid gap-2 text-sm">
            <span className="font-medium">
              {t(
                "billing.catalogPage.filters.availability"
              )}
            </span>
            <Select
              name="availability"
              defaultValue={
                filters.availability ?? ""
              }
            >
              <option value="">
                {t(
                  "billing.catalogPage.filters.allPlans"
                )}
              </option>
              <option value="active">
                {t(
                  "billing.catalogPage.filters.onlyActive"
                )}
              </option>
              <option value="inactive">
                {t(
                  "billing.catalogPage.filters.onlyInactive"
                )}
              </option>
            </Select>
          </label>

          <div className="flex items-end gap-2">
            <Button type="submit">
              <Filter className="size-4" />
              {t("shared.actions.applyFilters")}
            </Button>
            <Button
              type="button"
              asChild
              variant="outline"
            >
              <a href={planosComerciaisUrl({ tab: "plans" })}>
                {t("shared.actions.clear")}
              </a>
            </Button>
          </div>
        </form>

        <div className="space-y-4 p-5">
          {filteredPlans.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6">
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  {t(
                    "billing.catalogPage.empty.description"
                  )}
                </p>
                <Button
                  type="button"
                  asChild
                  variant="outline"
                >
                  <a href={planosComerciaisUrl({ tab: "plans" })}>
                    {t("shared.actions.clear")}
                  </a>
                </Button>
              </div>
            </div>
          ) : (
            filteredPlans.map((plan) => {
              const planSubscriptions =
                overview.clinicSubscriptions.filter(
                  (subscription) =>
                    subscription.clinicBillingPlanId ===
                    plan.id
                );

              return (
                <div
                  key={plan.id}
                  className="grid gap-4 rounded-2xl border p-4 md:grid-cols-2 xl:grid-cols-6"
                >
                  <div className="grid gap-2 text-sm xl:col-span-2">
                    <span className="font-medium text-foreground">
                      {t(
                        "billing.catalogPage.table.planName"
                      )}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {plan.name}
                    </span>
                  </div>

                  <div className="grid gap-2 text-sm xl:col-span-2">
                    <span className="font-medium text-foreground">
                      {t(
                        "billing.catalogPage.table.commercialDescription"
                      )}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {plan.description ??
                        t(
                          "billing.catalogPage.table.noDescription"
                        )}
                    </span>
                  </div>

                  <div className="grid gap-2 text-sm">
                    <span className="font-medium text-foreground">
                      {t(
                        "billing.catalogPage.table.monthlyPrice"
                      )}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(
                        plan.monthlyPrice ?? 0
                      )}
                    </span>
                  </div>

                  <div className="grid gap-2 text-sm">
                    <span className="font-medium text-foreground">
                      {t(
                        "billing.catalogPage.table.annualPrice"
                      )}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(
                        plan.annualPrice ?? 0
                      )}
                    </span>
                  </div>

                  <div className="grid gap-1 rounded-xl bg-muted/30 p-3 text-xs text-muted-foreground xl:col-span-4">
                    <span>
                      {t("shared.labels.status")}:{" "}
                      {plan.active
                        ? t(
                            "billing.catalogPage.table.available"
                          )
                        : t(
                            "billing.catalogPage.table.outOfCatalog"
                          )}
                    </span>
                    <span>
                      {t(
                        "billing.catalogPage.table.linkedSubscriptions"
                      )}
                      :{" "}
                      {
                        planSubscriptions.length
                      }
                    </span>
                    <span>
                      {t(
                        "billing.catalogPage.includedModulesLabel"
                      )}
                      :{" "}
                      {v1ActiveModuleLabels}
                    </span>
                    <span>
                      {t(
                        "billing.catalogPage.table.referenceRevenue"
                      )}
                      :{" "}
                      {formatCurrency(
                        plan.monthlyPrice ?? 0
                      )}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-end justify-between gap-3 xl:col-span-2 xl:justify-end">
                    <StatusIndicator
                      tone={
                        plan.active
                          ? "success"
                          : "neutral"
                      }
                      label={
                        plan.active
                          ? t("shared.states.active")
                          : t("shared.states.inactive")
                      }
                    />
                    <Button
                      type="button"
                      asChild
                      variant="outline"
                      size="sm"
                    >
                      <a
                        href={empresasUrl({
                          planId: plan.id,
                        })}
                      >
                        <Building2 className="size-4" />
                        {t(
                          "billing.catalogPage.viewClinicsOnPlan"
                        )}
                      </a>
                    </Button>
                    <PlatformPlanSidePanel
                      mode="edit"
                      initialData={plan}
                      trigger={
                        <Button
                          type="button"
                          variant="outline"
                        >
                          <PencilLine className="size-4" />
                          {t(
                            "billing.catalogPage.editPlan"
                          )}
                        </Button>
                      }
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </SectionCard>
    </DashboardPage>
  );
}

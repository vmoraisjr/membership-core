import {
  CircleCheck,
  CircleOff,
  PencilLine,
  Filter,
  Plus,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { DashboardPage } from "@/components/layout/dashboard-page";
import { AccessDenied } from "@/features/rbac/components/access-denied";
import { getCurrentAppUser } from "@/features/auth/services/get-current-app-user";
import { getCurrentUserRole } from "@/features/auth/services/get-current-user-role";
import { hasPermission } from "@/features/rbac/permissions";
import { getTranslations } from "@/i18n/messages";
import { formatCurrency } from "@/lib/formatters";

import { getPlatformClinicBillingOverview } from "../services/billing-foundation";
import { PlatformPlanSidePanel } from "./platform-plan-side-panel";

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

  return (
    <DashboardPage>
      <PageHeader
        eyebrow="Comercial Sheep"
        title="Catálogo comercial"
        description="Organize os planos SaaS com nomes claros, preços consistentes e disponibilidade comercial fácil de entender."
        action={
          <PlatformPlanSidePanel
            trigger={
              <Button>
                <Plus className="size-4" />
                Novo plano
              </Button>
            }
          />
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <SectionCard
          title="Planos cadastrados"
          description="Total de opções mantidas no catálogo."
        >
          <div className="p-5 text-3xl font-semibold">
            {overview.allPlans.length}
          </div>
        </SectionCard>
        <SectionCard
          title="Planos comercializáveis"
          description="Itens ativos para novas contas clientes."
        >
          <div className="p-5 text-3xl font-semibold">
            {
              overview.allPlans.filter(
                (plan) => plan.active
              ).length
            }
          </div>
        </SectionCard>
        <SectionCard
          title="Clientes cobertos"
          description="Assinaturas SaaS vinculadas aos planos atuais."
        >
          <div className="p-5 text-3xl font-semibold">
            {overview.clinicSubscriptions.length}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Planos cadastrados"
        description="Filtre, revise e ajuste rapidamente o catálogo comercial antes de aplicar um plano em clientes."
      >
        <form
          method="get"
          className="grid gap-4 border-b p-5 md:grid-cols-[minmax(0,1fr)_220px_auto]"
        >
          <label className="grid gap-2 text-sm">
            <span className="font-medium">
              Buscar plano
            </span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="query"
                defaultValue={
                  filters.query ?? ""
                }
                placeholder="Nome ou descrição"
                className="pl-9"
              />
            </div>
          </label>

          <label className="grid gap-2 text-sm">
            <span className="font-medium">
              Disponibilidade
            </span>
            <select
              name="availability"
              defaultValue={
                filters.availability ?? ""
              }
              className="h-10 rounded-md border bg-background px-3"
            >
              <option value="">
                Todos os planos
              </option>
              <option value="active">
                Apenas ativos
              </option>
              <option value="inactive">
                Apenas inativos
              </option>
            </select>
          </label>

          <div className="flex items-end gap-2">
            <Button type="submit">
              <Filter className="size-4" />
              Filtrar
            </Button>
            <Button
              type="button"
              asChild
              variant="outline"
            >
              <a href="/dashboard/billing/catalog">
                Limpar
              </a>
            </Button>
          </div>
        </form>

        <div className="space-y-4 p-5">
          {filteredPlans.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6">
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Nenhum plano encontrado com os filtros atuais.
                </p>
                <Button
                  type="button"
                  asChild
                  variant="outline"
                >
                  <a href="/dashboard/billing/catalog">
                    Limpar filtros
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
                      Nome do plano
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {plan.name}
                    </span>
                  </div>

                  <div className="grid gap-2 text-sm xl:col-span-2">
                    <span className="font-medium text-foreground">
                      Descrição comercial
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {plan.description ??
                        "Sem descrição cadastrada."}
                    </span>
                  </div>

                  <div className="grid gap-2 text-sm">
                    <span className="font-medium text-foreground">
                      Preço mensal
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(
                        plan.monthlyPrice ?? 0
                      )}
                    </span>
                  </div>

                  <div className="grid gap-2 text-sm">
                    <span className="font-medium text-foreground">
                      Preço anual
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(
                        plan.annualPrice ?? 0
                      )}
                    </span>
                  </div>

                  <div className="grid gap-1 rounded-xl bg-muted/30 p-3 text-xs text-muted-foreground xl:col-span-4">
                    <span>
                      Situação atual:{" "}
                      {plan.active
                        ? "disponível"
                        : "fora do catálogo"}
                    </span>
                    <span>
                      Assinaturas ligadas a este plano:{" "}
                      {
                        planSubscriptions.length
                      }
                    </span>
                    <span>
                      Receita mensal de referência:{" "}
                      {formatCurrency(
                        plan.monthlyPrice ?? 0
                      )}
                    </span>
                  </div>

                  <div className="flex items-end justify-between gap-3 xl:col-span-2 xl:justify-end">
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
                        plan.active
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {plan.active ? (
                        <CircleCheck className="size-3.5" />
                      ) : (
                        <CircleOff className="size-3.5" />
                      )}
                      {plan.active
                        ? "Ativo"
                        : "Inativo"}
                    </span>
                    <PlatformPlanSidePanel
                      mode="edit"
                      initialData={plan}
                      trigger={
                        <Button
                          type="button"
                          variant="outline"
                        >
                          <PencilLine className="size-4" />
                          Editar plano
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

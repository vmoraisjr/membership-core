"use client";

import { useState } from "react";

import type {
  BenefitType,
  ResetPeriod,
} from "@prisma/client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { DataTableContainer } from "@/components/dashboard/data-table-container";
import { EmptyState } from "@/components/dashboard/empty-state";

import { MembershipBenefitRowActions } from "./membership-benefit-row-actions";

type BenefitWithPlan = {
  id: string;
  title: string;
  description?: string | null;
  active: boolean;
  type: BenefitType;
  discountPercentage?: number | null;
  membershipPlanId: string;
  membershipPlan: {
    id: string;
    name: string;
    active: boolean;
  };
  discountAmount?: number | null;
  usageLimit?: number | null;
  resetPeriod?: ResetPeriod | null;
};

type Props = {
  benefits: BenefitWithPlan[];

  plans: Array<{
    id: string;
    name: string;
  }>;

  selectedPlanId?: string;
  canManageBenefits?: boolean;
  canDeleteBenefitsPermanently?: boolean;
};

function getUsagePolicyLabel(
  benefit: BenefitWithPlan
) {
  if (benefit.resetPeriod === "MONTHLY") {
    return benefit.usageLimit == null
      ? "Uso mensal sem limite"
      : `Uso mensal · ${benefit.usageLimit}/mês`;
  }

  if (benefit.usageLimit != null) {
    return `Uso total · ${benefit.usageLimit} usos`;
  }

  return "Sem limite";
}

export function MembershipBenefitsTable({
  benefits,
  plans,
  selectedPlanId,
  canManageBenefits = true,
  canDeleteBenefitsPermanently = true,
}: Props) {
  const [statusFilter, setStatusFilter] =
    useState("all");
  const [planFilter, setPlanFilter] =
    useState(selectedPlanId ?? "all");
  const [search, setSearch] =
    useState("");

  const normalizedSearch =
    search.trim().toLowerCase();

  const visibleBenefits = benefits.filter(
    (benefit) => {
      if (
        planFilter &&
        planFilter !== "all" &&
        benefit.membershipPlanId !==
          planFilter
      ) {
        return false;
      }

      if (
        statusFilter === "active" &&
        !benefit.active
      ) {
        return false;
      }

      if (
        statusFilter ===
          "inactive" &&
        benefit.active
      ) {
        return false;
      }

      if (
        normalizedSearch.length > 0 &&
        !benefit.title
          .toLowerCase()
          .includes(
            normalizedSearch
          )
      ) {
        return false;
      }

      return true;
    }
  );

  return (
    <DataTableContainer
      title="Catálogo de benefícios"
      description={
        selectedPlanId
          ? "Mostrando apenas benefícios do plano selecionado."
          : "Benefícios vinculados a planos para operação e histórico."
      }
      toolbar={
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-muted-foreground">
              Filtro de status
            </label>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className="h-10 rounded-xl border border-input bg-background px-3"
            >
              <option value="all">
                Todos
              </option>
              <option value="active">
                Ativos
              </option>
              <option value="inactive">
                Inativos
              </option>
            </select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-muted-foreground">
              Filtro de plano
            </label>
            <select
              value={planFilter}
              onChange={(e) =>
                setPlanFilter(
                  e.target.value
                )
              }
              className="h-10 rounded-xl border border-input bg-background px-3"
            >
              <option value="all">
                Todos os planos
              </option>
              {plans.map((plan) => (
                <option
                  key={plan.id}
                  value={plan.id}
                >
                  {plan.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2 sm:min-w-80">
            <label className="text-sm font-medium text-muted-foreground">
              Buscar benefício
            </label>
            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Buscar nome do benefício"
              className="h-10 rounded-xl border border-input bg-background px-3"
            />
          </div>
        </div>
      }
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              Benefício
            </TableHead>

            <TableHead>
              Descrição
            </TableHead>

            <TableHead>
              Percentual
            </TableHead>

            <TableHead>
              Plano
            </TableHead>

            <TableHead>
              Status
            </TableHead>

            <TableHead>
              Uso
            </TableHead>

            <TableHead>
              Ações
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {visibleBenefits.map((benefit) => (
            <TableRow
              key={benefit.id}
            >
              <TableCell className="min-w-[14rem]">
                {benefit.title}
              </TableCell>

              <TableCell className="min-w-[18rem] whitespace-normal">
                {benefit.description ||
                  "Sem descrição"}
              </TableCell>

              <TableCell>
                {benefit.discountPercentage !=
                null
                  ? `${benefit.discountPercentage}%`
                  : "-"}
              </TableCell>

              <TableCell>
                {
                  benefit.membershipPlan
                    .name
                }
              </TableCell>

              <TableCell>
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                  {benefit.active
                    ? "Ativo"
                    : "Inativo"}
                </span>
              </TableCell>

              <TableCell>
                {getUsagePolicyLabel(
                  benefit
                )}
              </TableCell>

              <TableCell>
                <MembershipBenefitRowActions
                  benefit={benefit}
                  plans={plans}
                  planIsActive={
                    benefit.membershipPlan
                      .active
                  }
                  canManageBenefits={
                    canManageBenefits
                  }
                  canDeleteBenefitsPermanently={
                    canDeleteBenefitsPermanently
                  }
                />
              </TableCell>
            </TableRow>
          ))}

          {visibleBenefits.length ===
            0 && (
            <TableRow>
              <TableCell
                colSpan={7}
                className="p-0"
              >
                <EmptyState
                  title="Nenhum benefício encontrado"
                  description="Nenhum benefício corresponde aos filtros atuais."
                />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </DataTableContainer>
  );
}

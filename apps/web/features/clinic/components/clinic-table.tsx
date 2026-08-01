"use client";

import { useState } from "react";
import {
  Building2,
  MapPin,
  Search,
} from "lucide-react";

import {
  ClinicStatus,
  ClinicSubscriptionStatus,
} from "@prisma/client";

import { DataTableContainer } from "@/components/dashboard/data-table-container";
import { EmptyState } from "@/components/dashboard/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";

import { ClinicRowActions } from "./clinic-row-actions";

type ClinicTableItem = {
  id: string;
  name: string;
  brandName: string | null;
  logoUrl: string | null;
  slug: string;
  document: string;
  email: string;
  phone: string;
  zipCode: string;
  city: string;
  state: string;
  address: string;
  status: ClinicStatus;
  createdAt: Date;
  _count: {
    patients: number;
    membershipPlans: number;
  };
  clinicSubscriptions: Array<{
    id: string;
    status: ClinicSubscriptionStatus;
    clinicBillingPlan: {
      name: string;
    };
  }>;
};

type Props = {
  clinics: ClinicTableItem[];
  canManageClinic?: boolean;
  isPlatformView?: boolean;
};

export function ClinicTable({
  clinics,
  canManageClinic = true,
  isPlatformView = false,
}: Props) {
  const [statusFilter, setStatusFilter] =
    useState("active");
  const [search, setSearch] =
    useState("");

  const normalizedSearch =
    search.trim().toLowerCase();

  const visibleClinics =
    clinics.filter((clinic) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" &&
          clinic.status ===
            ClinicStatus.ACTIVE) ||
        (statusFilter ===
          "inactive" &&
          clinic.status ===
            ClinicStatus.INACTIVE);

      const matchesSearch =
        normalizedSearch.length === 0 ||
        clinic.name
          .toLowerCase()
          .includes(normalizedSearch) ||
        (clinic.brandName ?? "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        clinic.slug
          .toLowerCase()
          .includes(normalizedSearch);

      return (
        matchesStatus &&
        matchesSearch
      );
    });

  const activeClinicsCount =
    clinics.filter(
      (clinic) =>
        clinic.status ===
        ClinicStatus.ACTIVE
    ).length;

  return (
    <DataTableContainer
      title={
        isPlatformView
          ? "Gestão de contas clientes"
          : "Administração da empresa"
      }
      description={`${activeClinicsCount} conta(s) ativa(s) disponível(is) neste contexto.`}
      toolbar={
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
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
              <option value="active">
                Ativas
              </option>
              <option value="inactive">
                Inativas
              </option>
              <option value="all">
                Todas
              </option>
            </select>
          </div>

          <div className="grid gap-2 sm:min-w-80">
            <label className="text-sm font-medium text-muted-foreground">
              Buscar empresa
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Buscar por nome, exibição ou slug"
                className="pl-9"
              />
            </div>
          </div>
        </div>
      }
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Empresa</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Localização</TableHead>
            <TableHead>Plano</TableHead>
            <TableHead>Clientes</TableHead>
            <TableHead>Planos</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {visibleClinics.map((clinic) => (
            <TableRow key={clinic.id}>
              <TableCell className="min-w-[18rem] align-top">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl border border-border/70 bg-[color:var(--color-surface-subtle)] p-3 text-muted-foreground shadow-[var(--shadow-xs)]">
                    <Building2 className="size-4" />
                  </div>
                  <div className="space-y-1">
                    <div className="font-medium">
                    {clinic.brandName ||
                      clinic.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {clinic.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {clinic.slug}
                    </div>
                  </div>
                </div>
              </TableCell>

              <TableCell className="align-top">
                <span
                  className={`status-badge ${
                    clinic.status ===
                    ClinicStatus.ACTIVE
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {clinic.status ===
                  ClinicStatus.ACTIVE
                    ? "Ativa"
                    : "Inativa"}
                </span>
              </TableCell>

              <TableCell className="min-w-[14rem] align-top">
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-4 text-muted-foreground" />
                  <div className="space-y-1">
                    <div className="font-medium">
                    {clinic.city}, {clinic.state}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {clinic.address}
                    </div>
                  </div>
                </div>
              </TableCell>

              <TableCell className="align-top">
                {clinic.clinicSubscriptions[0] ? (
                  <div className="space-y-1 text-sm">
                    <div className="font-medium">
                      {
                        clinic
                          .clinicSubscriptions[0]
                          .clinicBillingPlan
                          .name
                      }
                    </div>
                    <span className="status-badge bg-sky-100 text-sky-700">
                      {
                        clinic
                          .clinicSubscriptions[0]
                          .status
                      }
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Sem plano ativo
                  </span>
                )}
              </TableCell>

              <TableCell className="align-top">
                {clinic._count.patients}
              </TableCell>

              <TableCell className="align-top">
                {clinic._count.membershipPlans}
              </TableCell>

              <TableCell className="align-top">
                <ClinicRowActions
                  clinic={clinic}
                  canManageClinic={
                    canManageClinic
                  }
                  isPlatformView={
                    isPlatformView
                  }
                />
              </TableCell>
            </TableRow>
          ))}

          {visibleClinics.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="p-0"
              >
                <EmptyState
                  title="Nenhuma empresa encontrada"
                  description="Ajuste os filtros ou cadastre uma nova conta cliente para continuar."
                  action={
                    canManageClinic &&
                    isPlatformView ? (
                      <div className="pt-2">
                        <span className="workspace-kicker">
                          Revise busca e status
                        </span>
                      </div>
                    ) : undefined
                  }
                />
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </DataTableContainer>
  );
}

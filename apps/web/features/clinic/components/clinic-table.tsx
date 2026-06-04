"use client";

import { useState } from "react";

import { ClinicStatus } from "@prisma/client";

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

import { ClinicRowActions } from "./clinic-row-actions";

type ClinicTableItem = {
  id: string;
  name: string;
  brandName: string | null;
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
};

type Props = {
  clinics: ClinicTableItem[];
  canManageClinic?: boolean;
};

export function ClinicTable({
  clinics,
  canManageClinic = true,
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
      title="Clinic Administration"
      description={`${activeClinicsCount} active clinics currently managed in the platform.`}
    >
      <div className="flex flex-col gap-4 border-b p-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid gap-2">
          <label className="text-sm text-muted-foreground">
            Status filter
          </label>
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
            className="h-10 rounded-md border px-3"
          >
            <option value="active">
              Active
            </option>
            <option value="inactive">
              Inactive
            </option>
            <option value="all">
              All
            </option>
          </select>
        </div>

        <div className="grid gap-2 sm:min-w-80">
          <label className="text-sm text-muted-foreground">
            Search by clinic
          </label>
          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search clinic, brand, or slug"
            className="h-10 rounded-md border px-3"
          />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Clinic</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Patients</TableHead>
            <TableHead>Plans</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {visibleClinics.map((clinic) => (
            <TableRow key={clinic.id}>
              <TableCell className="align-top">
                <div className="space-y-1">
                  <div className="font-medium">
                    {clinic.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {clinic.brandName ||
                      "No brand name."}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {clinic.slug}
                  </div>
                </div>
              </TableCell>

              <TableCell className="align-top">
                <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium">
                  {clinic.status ===
                  ClinicStatus.ACTIVE
                    ? "Active"
                    : "Inactive"}
                </span>
              </TableCell>

              <TableCell className="align-top">
                <div className="space-y-1">
                  <div className="font-medium">
                    {clinic.city}, {clinic.state}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {clinic.address}
                  </div>
                </div>
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
                />
              </TableCell>
            </TableRow>
          ))}

          {visibleClinics.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="p-0"
              >
                <EmptyState
                  title="No clinics found"
                  description="Adjust the filters or create a new clinic to continue."
                />
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </DataTableContainer>
  );
}

"use client";

import { useState } from "react";

import Link from "next/link";

import { EmptyState } from "@/components/dashboard/empty-state";
import { DataTableContainer } from "@/components/dashboard/data-table-container";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { PatientRowActions } from "./patient-row-actions";

type PatientWithCurrentSubscription = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  birthDate: Date;
  document: string;
  zipCode: string;
  city: string;
  state: string;
  address: string;
  status: "ACTIVE" | "INACTIVE";
  currentSubscription:
    | {
        status: string;
        membershipPlan: {
          name: string;
        };
      }
    | null;
};

type Props = {
  patients: PatientWithCurrentSubscription[];
  plans: Array<{ id: string; name: string }>;
  canManagePatients?: boolean;
  canManageSubscriptions?: boolean;
};

function maskDocument(doc: string) {
  if (!doc) return "";
  const cleaned = String(doc);
  if (cleaned.length <= 4) return cleaned;
  const middle = "*".repeat(
    Math.max(0, cleaned.length - 4)
  );
  return `${cleaned.slice(0, 2)}${middle}${cleaned.slice(-2)}`;
}

function formatBirthDate(
  value: Date | string
) {
  if (!value) return "";
  const d = new Date(value);
  return d.toLocaleDateString();
}

export function PatientsTable({
  patients,
  plans,
  canManagePatients = true,
  canManageSubscriptions = true,
}: Props) {
  const [statusFilter, setStatusFilter] =
    useState("active");
  const [search, setSearch] =
    useState("");

  const normalizedSearch =
    search.trim().toLowerCase();

  const visiblePatients =
    patients.filter((patient) => {
      const matchesStatus =
        statusFilter === "all" ||
        patient.status ===
          statusFilter.toUpperCase();

      const matchesSearch =
        normalizedSearch.length === 0 ||
        patient.fullName
          .toLowerCase()
          .includes(
            normalizedSearch
          ) ||
        patient.document
          .toLowerCase()
          .includes(
            normalizedSearch
          );

      return (
        matchesStatus &&
        matchesSearch
      );
    });

  const activePatientsCount =
    patients.filter(
      (patient) =>
        patient.status === "ACTIVE"
    ).length;

  return (
    <DataTableContainer
      title="Patient Directory"
      description={`${activePatientsCount} active patients available for subscriptions.`}
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
            Search by patient or document
          </label>
          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search name or document"
            className="h-10 rounded-md border px-3"
          />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Patient</TableHead>
            <TableHead>Birth date</TableHead>
            <TableHead>Document</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>
              Current Plan
            </TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {visiblePatients.map(
            (patient) => (
              <TableRow key={patient.id}>
                <TableCell className="align-top">
                  <div className="space-y-1">
                    <div className="font-medium">
                      {
                        patient.fullName
                      }
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {patient.email}
                    </div>
                  </div>
                </TableCell>

                <TableCell className="align-top">
                  {formatBirthDate(patient.birthDate)}
                </TableCell>

                <TableCell className="align-top">
                  {maskDocument(patient.document)}
                </TableCell>

                <TableCell className="align-top">
                  <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium">
                    {patient.status}
                  </span>
                </TableCell>

                <TableCell className="align-top">
                  {patient.currentSubscription && patient.currentSubscription.status === "ACTIVE" ? (
                    <Link
                      href={`/dashboard/subscriptions?patientId=${patient.id}`}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {patient.currentSubscription.membershipPlan.name}
                    </Link>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      No subscription
                    </span>
                  )}
                </TableCell>

                <TableCell className="text-right align-top">
                  <PatientRowActions
                    patient={{
                      id: patient.id,
                      fullName:
                        patient.fullName,
                      email:
                        patient.email,
                      phone:
                        patient.phone,
                      birthDate:
                        patient.birthDate,
                      document:
                        patient.document,
                      zipCode:
                        patient.zipCode,
                      city: patient.city,
                      state:
                        patient.state,
                      address:
                        patient.address,
                      status:
                        patient.status,
                    }}
                    plans={plans}
                    canManagePatients={
                      canManagePatients
                    }
                    canManageSubscriptions={
                      canManageSubscriptions
                    }
                  />
                </TableCell>
              </TableRow>
            )
          )}

          {visiblePatients.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={6}
                className="p-0"
              >
                <EmptyState
                  title="No patients found"
                  description="Adjust the filters or create a new patient record to continue."
                />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </DataTableContainer>
  );
}

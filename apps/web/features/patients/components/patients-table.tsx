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

import type {
  MembershipPlan,
  Patient,
  Subscription,
} from "@prisma/client";

import { PatientRowActions } from "./patient-row-actions";

type PatientWithCurrentSubscription =
  Patient & {
    currentSubscription:
      | (Subscription & {
          membershipPlan: MembershipPlan;
        })
      | null;
  };

type Props = {
  patients: PatientWithCurrentSubscription[];
  plans: Array<{
    id: string;
    name: string;
  }>;
};

export function PatientsTable({
  patients,
  plans,
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
            <TableHead>Document</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>
              Current Plan
            </TableHead>
            <TableHead>
              Subscription
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
                  {patient.document}
                </TableCell>

                <TableCell className="align-top">
                  <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium">
                    {patient.status}
                  </span>
                </TableCell>

                <TableCell className="align-top">
                  {patient.currentSubscription ? (
                    <Link
                      href={`/dashboard/subscriptions?patientId=${patient.id}`}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {
                        patient
                          .currentSubscription
                          .membershipPlan
                          .name
                      }
                    </Link>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      No subscription
                    </span>
                  )}
                </TableCell>

                <TableCell className="align-top">
                  {patient.currentSubscription ? (
                    patient
                      .currentSubscription
                      .status
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Not subscribed
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

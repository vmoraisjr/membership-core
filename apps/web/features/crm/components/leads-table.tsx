"use client";

import { useMemo, useState } from "react";

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

import { LeadRowActions } from "./lead-row-actions";

type LeadItem = {
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
  status:
    | "NEW"
    | "CONTACTED"
    | "PROPOSAL"
    | "NEGOTIATION"
    | "WON"
    | "LOST";
  convertedPatient: {
    id: string;
    fullName: string;
  } | null;
  notes: Array<{
    id: string;
    content: string;
    createdAt: Date;
  }>;
  _count: {
    activities: number;
    notes: number;
  };
  updatedAt: Date;
};

type Props = {
  leads: LeadItem[];
  plans: Array<{
    id: string;
    name: string;
  }>;
  canManageCrm?: boolean;
  canManageSubscriptions?: boolean;
};

const statusLabels: Record<
  LeadItem["status"],
  string
> = {
  NEW: "New",
  CONTACTED: "Contacted",
  PROPOSAL: "Proposal",
  NEGOTIATION: "Negotiation",
  WON: "Won",
  LOST: "Lost",
};

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString();
}

export function LeadsTable({
  leads,
  plans,
  canManageCrm = true,
  canManageSubscriptions = true,
}: Props) {
  const [statusFilter, setStatusFilter] =
    useState("all");
  const [search, setSearch] =
    useState("");

  const normalizedSearch =
    search.trim().toLowerCase();

  const visibleLeads = useMemo(
    () =>
      leads.filter((lead) => {
        const matchesStatus =
          statusFilter === "all" ||
          lead.status === statusFilter;
        const matchesSearch =
          normalizedSearch.length === 0 ||
          lead.fullName
            .toLowerCase()
            .includes(
              normalizedSearch
            ) ||
          lead.email
            .toLowerCase()
            .includes(
              normalizedSearch
            ) ||
          lead.city
            .toLowerCase()
            .includes(
              normalizedSearch
            );

        return (
          matchesStatus &&
          matchesSearch
        );
      }),
    [leads, normalizedSearch, statusFilter]
  );

  const convertedCount = leads.filter(
    (lead) => lead.convertedPatient
  ).length;

  return (
    <DataTableContainer
      title="Lead Registry"
      description={`${convertedCount} converted leads already became patients and are ready for subscription follow-up.`}
    >
      <div className="flex flex-col gap-4 border-b p-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid gap-2">
          <label className="text-sm text-muted-foreground">
            Pipeline stage
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
            <option value="all">
              All stages
            </option>
            {Object.entries(
              statusLabels
            ).map(
              ([value, label]) => (
                <option
                  key={value}
                  value={value}
                >
                  {label}
                </option>
              )
            )}
          </select>
        </div>

        <div className="grid gap-2 sm:min-w-80">
          <label className="text-sm text-muted-foreground">
            Search by lead, email, or city
          </label>
          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search leads"
            className="h-10 rounded-md border px-3"
          />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Lead</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Last note</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead>Lifecycle</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {visibleLeads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell className="align-top">
                <div className="space-y-1">
                  <div className="font-medium">
                    {lead.fullName}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {lead.email}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {lead.phone}
                  </div>
                </div>
              </TableCell>

              <TableCell className="align-top">
                <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium">
                  {
                    statusLabels[
                      lead.status
                    ]
                  }
                </span>
              </TableCell>

              <TableCell className="align-top">
                {lead.city}, {lead.state}
              </TableCell>

              <TableCell className="max-w-xs align-top text-sm text-muted-foreground">
                {lead.notes[0]?.content ??
                  "No notes yet"}
              </TableCell>

              <TableCell className="align-top text-sm text-muted-foreground">
                {formatDate(
                  lead.updatedAt
                )}
              </TableCell>

              <TableCell className="align-top">
                {lead.convertedPatient ? (
                  <div className="space-y-1">
                    <div className="font-medium text-emerald-700">
                      Patient created
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {
                        lead.convertedPatient
                          .fullName
                      }
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Lead only
                  </div>
                )}
              </TableCell>

              <TableCell className="text-right align-top">
                <LeadRowActions
                  lead={lead}
                  plans={plans}
                  canManageCrm={
                    canManageCrm
                  }
                  canManageSubscriptions={
                    canManageSubscriptions
                  }
                />
              </TableCell>
            </TableRow>
          ))}

          {visibleLeads.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="p-0"
              >
                <EmptyState
                  title="No leads found"
                  description="Adjust the filters or create a new lead to start the CRM pipeline."
                />
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </DataTableContainer>
  );
}

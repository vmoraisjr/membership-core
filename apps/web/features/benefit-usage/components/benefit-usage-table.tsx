"use client";

import { useState } from "react";

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

type BenefitUsageHistoryItem = {
  id: string;
  quantity: number;
  usedBy: string;
  usedAt: Date;
  notes: string | null;
  subscription: {
    id: string;
    patientId: string;
    patient: {
      id: string;
      fullName: string;
    };
    membershipPlan: {
      id: string;
      name: string;
    };
  };
  membershipBenefit: {
    id: string;
    title: string;
  };
};

type Props = {
  usages: BenefitUsageHistoryItem[];
};

export function BenefitUsageTable({
  usages,
}: Props) {
  const [search, setSearch] =
    useState("");

  const normalizedSearch =
    search.trim().toLowerCase();

  const visibleUsages = usages.filter(
    (usage) => {
      if (
        normalizedSearch.length === 0
      ) {
        return true;
      }

      return [
        usage.subscription.patient
          .fullName,
        usage.membershipBenefit.title,
        usage.usedBy,
      ].some((value) =>
        value
          .toLowerCase()
          .includes(
            normalizedSearch
          )
      );
    }
  );

  return (
    <DataTableContainer
      title="Benefit Usage History"
      description="Track every consumption event by patient and benefit."
    >
      <div className="border-b p-6">
        <div className="grid gap-2 sm:max-w-80">
          <label className="text-sm text-muted-foreground">
            Search history
          </label>
          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search patient, benefit, or staff"
            className="h-10 rounded-md border px-3"
          />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              Patient
            </TableHead>
            <TableHead>
              Benefit
            </TableHead>
            <TableHead>
              Date
            </TableHead>
            <TableHead>
              Quantity
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {visibleUsages.map((usage) => (
            <TableRow key={usage.id}>
              <TableCell>
                {
                  usage.subscription
                    .patient.fullName
                }
              </TableCell>
              <TableCell>
                {
                  usage.membershipBenefit
                    .title
                }
              </TableCell>
              <TableCell>
                {new Date(
                  usage.usedAt
                ).toLocaleString()}
              </TableCell>
              <TableCell>
                {usage.quantity}
              </TableCell>
            </TableRow>
          ))}

          {visibleUsages.length ===
            0 && (
            <TableRow>
              <TableCell
                colSpan={4}
                className="p-0"
              >
                <EmptyState
                  title="No usage history found"
                  description="No benefit consumption matches the current filters."
                />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </DataTableContainer>
  );
}

"use client";

import { useState, useTransition } from "react";

import { BenefitUsageStatus } from "@prisma/client";
import { toast } from "sonner";

import { cancelBenefitUsageAction } from "../actions/cancel-benefit-usage";

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
  status: BenefitUsageStatus;
  canceledAt: Date | null;
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
  canCancelBenefitUsage?: boolean;
};

export function BenefitUsageTable({
  usages,
  canCancelBenefitUsage = false,
}: Props) {
  const [search, setSearch] =
    useState("");
  const [isPending, startTransition] =
    useTransition();

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

  async function handleCancelUsage(
    usageId: string
  ) {
    startTransition(async () => {
      try {
        const formData =
          new FormData();
        formData.set("usageId", usageId);
        await cancelBenefitUsageAction(
          formData
        );
        toast.success(
          "Benefit usage canceled."
        );
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to cancel benefit usage."
        );
      }
    });
  }

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
            <TableHead>
              Status
            </TableHead>
            <TableHead>
              Actions
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
              <TableCell>
                {usage.status ===
                BenefitUsageStatus.CANCELED
                  ? `Canceled${usage.canceledAt ? ` on ${new Date(
                      usage.canceledAt
                    ).toLocaleString()}` : ""}`
                  : "Active"}
              </TableCell>
              <TableCell>
                {canCancelBenefitUsage &&
                usage.status ===
                  BenefitUsageStatus.ACTIVE ? (
                  <button
                    type="button"
                    onClick={() =>
                      handleCancelUsage(
                        usage.id
                      )
                    }
                    disabled={isPending}
                    className="rounded-md border px-3 py-1.5 text-sm"
                  >
                    Cancel usage
                  </button>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {usage.status ===
                    BenefitUsageStatus.CANCELED
                      ? "Historical record"
                      : "No actions"}
                  </span>
                )}
              </TableCell>
            </TableRow>
          ))}

          {visibleUsages.length ===
            0 && (
            <TableRow>
              <TableCell
                colSpan={6}
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

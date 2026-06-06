"use client";

import {
  ArrowRightLeft,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { SubscriptionDialog } from "@/features/subscriptions/components/subscription-dialog";

import { convertLeadToPatient } from "../actions/convert-lead-to-patient";
import { deleteLead } from "../actions/delete-lead";

import { LeadDialog } from "./lead-dialog";

type Props = {
  lead: {
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
  };
  plans: Array<{
    id: string;
    name: string;
  }>;
  canManageCrm?: boolean;
  canManageSubscriptions?: boolean;
};

export function LeadRowActions({
  lead,
  plans,
  canManageCrm = true,
  canManageSubscriptions = true,
}: Props) {
  async function handleConvert() {
    try {
      await convertLeadToPatient(
        lead.id
      );

      toast.success(
        "Lead converted into patient."
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to convert lead."
      );
    }
  }

  async function handleDelete() {
    try {
      await deleteLead(lead.id);

      toast.success("Lead deleted.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete lead."
      );
    }
  }

  if (!canManageCrm) {
    return (
      <span className="text-xs text-muted-foreground">
        Read only
      </span>
    );
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <LeadDialog
        mode="edit"
        initialData={lead}
        trigger={
          <Button
            size="icon"
            variant="outline"
          >
            <Pencil className="size-4" />
          </Button>
        }
      />

      {lead.convertedPatient ? (
        canManageSubscriptions ? (
          <SubscriptionDialog
            patients={[
              {
                id: lead.convertedPatient.id,
                fullName:
                  lead.convertedPatient
                    .fullName,
              },
            ]}
            plans={plans}
            defaultPatientId={
              lead.convertedPatient.id
            }
            trigger={
              <Button
                size="icon"
                variant="outline"
              >
                <Plus className="size-4" />
              </Button>
            }
          />
        ) : null
      ) : (
        <ConfirmDialog
          title="Convert lead into patient?"
          description="This keeps the lead history, creates a patient record, and makes the person ready for a subscription."
          onConfirm={() =>
            handleConvert()
          }
          actionLabel="Convert lead"
          trigger={
            <Button
              size="icon"
              variant="outline"
            >
              <ArrowRightLeft className="size-4" />
            </Button>
          }
        />
      )}

      {!lead.convertedPatient ? (
        <ConfirmDialog
          title="Delete lead?"
          description="This permanently removes the lead and its CRM history."
          onConfirm={() =>
            handleDelete()
          }
          actionLabel="Delete lead"
          trigger={
            <Button
              size="icon"
              variant="destructive"
            >
              <Trash2 className="size-4" />
            </Button>
          }
        />
      ) : null}
    </div>
  );
}

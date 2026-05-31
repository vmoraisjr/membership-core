"use client";

import {
  CircleOff,
  Pencil,
  RotateCcw,
  Trash2,
  Plus,
} from "lucide-react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";

import { suspendPatient } from "../actions/suspend-patient";
import { reactivatePatient } from "../actions/reactivate-patient";
import { deletePatientPermanently } from "../actions/delete-patient-permanently";

import { PatientDialog } from "./patient-dialog";
import { SubscriptionDialog } from "@/features/subscriptions/components/subscription-dialog";

type Props = {
  patient: {
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

    status?: "ACTIVE" | "INACTIVE";
  };
  plans?: Array<{ id: string; name: string }>;
};

export function PatientRowActions({
  patient,
  plans = [],
}: Props) {
  async function handleSuspend({
    detailsValue,
  }: {
    typedValue: string;
    detailsValue: string;
  }) {
    try {
      await suspendPatient(
        patient.id,
        detailsValue
      );

      toast.success(
        "Patient deactivated and subscriptions canceled."
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to deactivate patient."
      );
    }
  }

  async function handleReactivate() {
    try {
      await reactivatePatient(
        patient.id
      );

      toast.success(
        "Patient reactivated."
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to reactivate patient."
      );
    }
  }

  async function handleDelete() {
    try {
      await deletePatientPermanently(
        patient.id
      );

      toast.success(
        "Patient permanently deleted."
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to permanently delete patient."
      );
    }
  }

  return (
    <div className="flex items-center gap-2">
      {patient.status === "ACTIVE" ? (
        <>
          <PatientDialog
            mode="edit"
            initialData={patient}
            trigger={
              <Button
                size="icon"
                variant="outline"
              >
                <Pencil className="size-4" />
              </Button>
            }
          />

          <SubscriptionDialog
            patients={[{ id: patient.id, fullName: patient.fullName }]}
            plans={plans}
            defaultPatientId={patient.id}
            trigger={
              <Button size="icon" variant="outline">
                <Plus className="size-4" />
              </Button>
            }
          />

          <ConfirmDialog
            title="Deactivate patient?"
            description="The patient record will become inactive, active subscriptions will be canceled, and you must provide a reason."
            onConfirm={handleSuspend}
            actionLabel="Deactivate patient"
            detailsLabel="Reason"
            detailsPlaceholder="Describe why this patient is being deactivated"
            detailsRequired
            detailsInput="textarea"
            trigger={
              <Button
                size="icon"
                variant="destructive"
              >
                <CircleOff className="size-4" />
              </Button>
            }
          />
        </>
      ) : (
        <>
          <ConfirmDialog
            title="Reactivate patient?"
            description="The patient record will become active again and available for new subscriptions."
            onConfirm={() =>
              handleReactivate()
            }
            actionLabel="Reactivate patient"
            trigger={
              <Button
                size="icon"
                variant="outline"
              >
                <RotateCcw className="size-4" />
              </Button>
            }
          />

          <ConfirmDialog
            title="Delete patient permanently?"
            description="This permanently removes the inactive patient record. This action cannot be undone."
            onConfirm={() =>
              handleDelete()
            }
            actionLabel="Delete permanently"
            trigger={
              <Button
                size="icon"
                variant="destructive"
              >
                <Trash2 className="size-4" />
              </Button>
            }
          />
        </>
      )}
    </div>
  );
}

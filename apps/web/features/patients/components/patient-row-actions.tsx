"use client";

import {
  Pencil,
  Trash2,
} from "lucide-react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";

import { deletePatient } from "../actions/delete-patient";

import { PatientDialog } from "./patient-dialog";

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
  };
};

export function PatientRowActions({
  patient,
}: Props) {
  async function handleDelete() {
    try {
      await deletePatient(
        patient.id
      );

      toast.success(
        "Patient deleted."
      );
    } catch {
      toast.error(
        "Failed to delete patient."
      );
    }
  }

  return (
    <div className="flex items-center gap-2">
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

      <ConfirmDialog
        title="Delete patient?"
        description="This action cannot be undone."
        onConfirm={handleDelete}
        trigger={
          <Button
            size="icon"
            variant="destructive"
          >
            <Trash2 className="size-4" />
          </Button>
        }
      />
    </div>
  );
}
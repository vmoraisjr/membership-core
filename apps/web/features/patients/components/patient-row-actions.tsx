"use client";

import {
  CircleOff,
  Pencil,
  UserPlus,
} from "lucide-react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";

import { suspendPatient } from "../actions/suspend-patient";
import { SubscriptionDialog } from "@/features/subscriptions/components/subscription-dialog";

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

    status?: "ACTIVE" | "INACTIVE";
  };

  plans: Array<{
    id: string;
    name: string;
  }>;
};

export function PatientRowActions({
  patient,
  plans,
}: Props) {
  async function handleSuspend() {
    try {
      await suspendPatient(
        patient.id
      );

      toast.success(
        "Patient suspended and subscriptions canceled."
      );
    } catch {
      toast.error(
        "Failed to suspend patient."
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

      {patient.status !==
        "INACTIVE" && (
        <>
          <SubscriptionDialog
            patients={[
              {
                id: patient.id,
                fullName:
                  patient.fullName,
              },
            ]}
            plans={plans}
            defaultPatientId={
              patient.id
            }
            trigger={
              <Button
                size="icon"
                variant="outline"
              >
                <UserPlus className="size-4" />
              </Button>
            }
          />

          <ConfirmDialog
            title="Suspend patient?"
            description="The patient record will become inactive and active subscriptions will be canceled."
            onConfirm={handleSuspend}
            actionLabel="Suspend patient"
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
      )}
    </div>
  );
}

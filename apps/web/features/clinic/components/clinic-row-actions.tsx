"use client";

import {
  CircleOff,
  Pencil,
  RotateCcw,
} from "lucide-react";

import { ClinicStatus } from "@prisma/client";

import { toast } from "sonner";

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { Button } from "@/components/ui/button";

import { deactivateClinic } from "../actions/deactivate-clinic";
import { reactivateClinic } from "../actions/reactivate-clinic";

import { ClinicDialog } from "./clinic-dialog";

type Props = {
  clinic: {
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
  };
  canManageClinic?: boolean;
};

export function ClinicRowActions({
  clinic,
  canManageClinic = true,
}: Props) {
  if (!canManageClinic) {
    return (
      <span className="text-xs text-muted-foreground">
        Read only
      </span>
    );
  }

  async function handleDeactivate() {
    try {
      await deactivateClinic(
        clinic.id
      );

      toast.success(
        "Clinic deactivated."
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to deactivate clinic."
      );
    }
  }

  async function handleReactivate() {
    try {
      await reactivateClinic(
        clinic.id
      );

      toast.success(
        "Clinic reactivated."
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to reactivate clinic."
      );
    }
  }

  return (
    <div className="flex items-center gap-2">
      <ClinicDialog
        mode="edit"
        initialData={clinic}
        trigger={
          <Button
            size="icon"
            variant="outline"
          >
            <Pencil className="size-4" />
          </Button>
        }
      />

      {clinic.status ===
      ClinicStatus.ACTIVE ? (
        <ConfirmDialog
          title="Deactivate clinic?"
          description="The clinic will become inactive and remain available for historical review."
          onConfirm={() =>
            handleDeactivate()
          }
          actionLabel="Deactivate clinic"
          trigger={
            <Button
              size="icon"
              variant="destructive"
            >
              <CircleOff className="size-4" />
            </Button>
          }
        />
      ) : (
        <ConfirmDialog
          title="Reactivate clinic?"
          description="The clinic will become active again and available for operational use."
          onConfirm={() =>
            handleReactivate()
          }
          actionLabel="Reactivate clinic"
          trigger={
            <Button
              size="icon"
              variant="outline"
            >
              <RotateCcw className="size-4" />
            </Button>
          }
        />
      )}
    </div>
  );
}

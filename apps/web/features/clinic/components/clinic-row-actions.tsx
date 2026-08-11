"use client";

import Link from "next/link";

import {
  CircleOff,
  Eye,
  ExternalLink,
  Pencil,
  RotateCcw,
} from "lucide-react";

import {
  ClinicStatus,
  ClinicSubscriptionStatus,
} from "@prisma/client";

import { toast } from "sonner";

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { Button } from "@/components/ui/button";
import { getFeedbackErrorMessage } from "@/lib/feedback";

import { deactivateClinic } from "../actions/deactivate-clinic";
import { reactivateClinic } from "../actions/reactivate-clinic";

import { ClinicDialog } from "./clinic-dialog";
import { ClinicQuickViewPanel } from "./clinic-quick-view-panel";

type Props = {
  clinic: {
    id: string;
    name: string;
    brandName: string | null;
    logoUrl: string | null;
    slug: string;
    document: string;
    email: string;
    phone: string;
    zipCode: string;
    city: string;
    state: string;
    address: string;
    createdAt: Date;
    _count: {
      patients: number;
      membershipPlans: number;
    };
    status: ClinicStatus;
    clinicSubscriptions?: Array<{
      id: string;
      status: ClinicSubscriptionStatus;
      clinicBillingPlan: {
        name: string;
      };
    }>;
  };
  canManageClinic?: boolean;
  isPlatformView?: boolean;
};

export function ClinicRowActions({
  clinic,
  canManageClinic = true,
  isPlatformView = false,
}: Props) {
  if (!canManageClinic) {
    return (
      <span className="text-xs text-muted-foreground">
        Somente leitura
      </span>
    );
  }

  async function handleDeactivate() {
    try {
      await deactivateClinic(
        clinic.id
      );

      toast.success(
        "Empresa cliente desativada com sucesso."
      );
    } catch (error) {
      toast.error(
        getFeedbackErrorMessage(
          error,
          "Não foi possível desativar a empresa cliente."
        )
      );
    }
  }

  async function handleReactivate() {
    try {
      await reactivateClinic(
        clinic.id
      );

      toast.success(
        "Empresa cliente reativada com sucesso."
      );
    } catch (error) {
      toast.error(
        getFeedbackErrorMessage(
          error,
          "Não foi possível reativar a empresa cliente."
        )
      );
    }
  }

  return (
    <div className="flex items-center gap-2">
      {isPlatformView ? (
        <ClinicQuickViewPanel
          clinic={clinic}
          trigger={
            <Button
              size="icon-sm"
              variant="ghost"
              title="Visão rápida"
              aria-label="Visão rápida"
            >
              <Eye className="size-4" />
            </Button>
          }
        />
      ) : null}

      {isPlatformView ? (
        <Button
          asChild
          size="icon-sm"
          variant="ghost"
        >
          <Link
            href={`/dashboard/clinics/${clinic.id}`}
          >
            <ExternalLink className="size-4" />
          </Link>
        </Button>
      ) : null}

      <ClinicDialog
        mode="edit"
        initialData={clinic}
        isPlatformView={isPlatformView}
        trigger={
          <Button
            size="icon-sm"
            variant="ghost"
          >
            <Pencil className="size-4" />
          </Button>
        }
      />

      {clinic.status ===
      ClinicStatus.ACTIVE ? (
        <ConfirmDialog
          title="Desativar clínica?"
          description="A clínica ficará inativa, mas continuará disponível para histórico."
          onConfirm={() =>
            handleDeactivate()
          }
          actionLabel="Desativar clínica"
          trigger={
            <Button
              size="icon-sm"
              variant="ghost"
              className="text-[color:var(--color-danger)] hover:bg-[color:var(--color-danger-soft)] hover:text-[color:var(--color-danger)]"
            >
              <CircleOff className="size-4" />
            </Button>
          }
        />
      ) : (
        <ConfirmDialog
          title="Reativar clínica?"
          description="A clínica voltará a ficar ativa para uso operacional."
          onConfirm={() =>
            handleReactivate()
          }
          actionLabel="Reativar clínica"
          trigger={
            <Button
              size="icon-sm"
              variant="ghost"
            >
              <RotateCcw className="size-4" />
            </Button>
          }
        />
      )}
    </div>
  );
}

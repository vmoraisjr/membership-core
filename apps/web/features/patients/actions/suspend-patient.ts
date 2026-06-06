"use server";

import { assertPermission } from "@/features/rbac/services/assert-permission";

import { revalidatePath } from "next/cache";

import {
  AuditAction,
  AuditEntity,
  PatientStatus,
  SubscriptionStatus,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";
import {
  createAuditLog,
  getCurrentAuditActor,
} from "@/features/audit-log/services/create-audit-log";

import { MANAGEABLE_SUBSCRIPTION_STATUSES } from "@/features/subscriptions/constants/manageable-subscription-statuses";
import { patientDeactivationSchema } from "../schemas/patient.schema";

export async function suspendPatient(
  id: string,
  inactiveReason: string
) {
  await assertPermission(
    "patients",
    "manage"
  );

  const clinic = await getCurrentClinic();
  const actor =
    await getCurrentAuditActor();

  const patient =
    await prisma.patient.findFirst({
      where: {
        id,
        clinicId: clinic.id,
      },
      select: {
        id: true,
        fullName: true,
      },
    });

  if (!patient) {
    throw new Error(
      "Patient not found."
    );
  }

  const parsedReason =
    patientDeactivationSchema.safeParse({
      inactiveReason,
    });

  if (!parsedReason.success) {
    throw new Error(
      "Suspension reason is required."
    );
  }

  const canceledAt = new Date();

  await prisma.$transaction(
    async (tx) => {
      const canceledSubscriptions =
        await tx.subscription.updateMany({
          where: {
            patientId: patient.id,
            status: {
              in: [
                ...MANAGEABLE_SUBSCRIPTION_STATUSES,
              ],
            },
          },
          data: {
            status:
              SubscriptionStatus.CANCELED,
            canceledAt,
          },
        });

      await tx.patient.update({
        where: {
          id: patient.id,
        },
        data: {
          status:
            PatientStatus.INACTIVE,
          inactiveReason:
            parsedReason.data
              .inactiveReason,
        },
      });

      await createAuditLog(tx, {
        clinicId: clinic.id,
        actor: actor.displayName,
        actorUserId: actor.id,
        action:
          AuditAction.DEACTIVATE,
        entity: AuditEntity.PATIENT,
        entityId: patient.id,
        entityLabel:
          patient.fullName,
        metadata: {
          inactiveReason:
            parsedReason.data
              .inactiveReason,
          canceledSubscriptions:
            canceledSubscriptions.count,
        },
      });
    }
  );

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/patients");
  revalidatePath("/dashboard/subscriptions");
  revalidatePath("/dashboard/plans");
}

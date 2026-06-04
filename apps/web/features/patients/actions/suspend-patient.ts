"use server";

import { assertPermission } from "@/features/rbac/services/assert-permission";

import { revalidatePath } from "next/cache";

import {
  PatientStatus,
  SubscriptionStatus,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";

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

  const patient =
    await prisma.patient.findFirst({
      where: {
        id,
        clinicId: clinic.id,
      },
      select: {
        id: true,
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

  await prisma.$transaction([
    prisma.patient.update({
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
    }),
    prisma.subscription.updateMany({
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
    }),
  ]);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/patients");
  revalidatePath("/dashboard/subscriptions");
  revalidatePath("/dashboard/plans");
}

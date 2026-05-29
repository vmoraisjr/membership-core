"use server";

import { revalidatePath } from "next/cache";

import {
  PatientStatus,
  SubscriptionStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";

import { MANAGEABLE_SUBSCRIPTION_STATUSES } from "@/features/subscriptions/constants/manageable-subscription-statuses";

export async function suspendPatient(
  id: string
) {
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

  const canceledAt = new Date();

  await prisma.$transaction([
    prisma.patient.update({
      where: {
        id: patient.id,
      },
      data: {
        status:
          PatientStatus.INACTIVE,
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

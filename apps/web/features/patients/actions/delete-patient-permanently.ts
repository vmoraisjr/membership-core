"use server";

import { assertPermission } from "@/features/rbac/services/assert-permission";

import { revalidatePath } from "next/cache";

import { PatientStatus } from "@prisma/client";

import prisma from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";

export async function deletePatientPermanently(
  id: string
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
        status: true,
        _count: {
          select: {
            subscriptions: true,
          },
        },
      },
    });

  if (!patient) {
    throw new Error(
      "Patient not found."
    );
  }

  if (
    patient.status !==
    PatientStatus.INACTIVE
  ) {
    throw new Error(
      "Only inactive patients can be permanently deleted."
    );
  }

  if (
    patient._count
      .subscriptions > 0
  ) {
    throw new Error(
      "This patient has subscription history and cannot be permanently deleted."
    );
  }

  await prisma.patient.delete({
    where: {
      id: patient.id,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/patients");
  revalidatePath("/dashboard/subscriptions");
}

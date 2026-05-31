"use server";

import { revalidatePath } from "next/cache";

import { PatientStatus } from "@prisma/client";

import prisma from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";

export async function reactivatePatient(
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
        status: true,
      },
    });

  if (!patient) {
    throw new Error(
      "Patient not found."
    );
  }

  if (
    patient.status ===
    PatientStatus.ACTIVE
  ) {
    throw new Error(
      "Patient is already active."
    );
  }

  await prisma.patient.update({
    where: {
      id: patient.id,
    },
    data: {
      status: PatientStatus.ACTIVE,
      inactiveReason: null,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/patients");
  revalidatePath("/dashboard/subscriptions");
}

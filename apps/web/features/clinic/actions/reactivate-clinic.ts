"use server";

import { assertPermission } from "@/features/rbac/services/assert-permission";

import { revalidatePath } from "next/cache";

import { ClinicStatus } from "@prisma/client";

import prisma from "@/lib/prisma";

export async function reactivateClinic(
  id: string
) {
  await assertPermission(
    "clinic",
    "manage"
  );

  const clinic =
    await prisma.clinic.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        status: true,
      },
    });

  if (!clinic) {
    throw new Error("Clinic not found.");
  }

  if (
    clinic.status ===
    ClinicStatus.ACTIVE
  ) {
    throw new Error(
      "Clinic is already active."
    );
  }

  await prisma.clinic.update({
    where: {
      id: clinic.id,
    },
    data: {
      status: ClinicStatus.ACTIVE,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/clinics");
}

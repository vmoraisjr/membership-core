"use server";

import { assertPermission } from "@/features/rbac/services/assert-permission";

import { revalidatePath } from "next/cache";

import { ClinicStatus } from "@prisma/client";

import prisma from "@/lib/prisma";

export async function deactivateClinic(
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
    ClinicStatus.INACTIVE
  ) {
    throw new Error(
      "Clinic is already inactive."
    );
  }

  await prisma.clinic.update({
    where: {
      id: clinic.id,
    },
    data: {
      status: ClinicStatus.INACTIVE,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/clinics");
}

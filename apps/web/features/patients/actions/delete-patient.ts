"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

export async function deletePatient(
  id: string
) {
  await prisma.patient.delete({
    where: {
      id,
    },
  });

  revalidatePath(
    "/dashboard/patients"
  );
}
"use server";

import { assertPermission } from "@/features/rbac/services/assert-permission";

import { revalidatePath } from "next/cache";

import prisma from "@/lib/prisma";

import {
  patientSchema,
  type PatientSchema,
} from "../schemas/patient.schema";

export async function updatePatient(
  id: string,
  data: PatientSchema
) {
  await assertPermission(
    "patients",
    "manage"
  );

  const parsed =
    patientSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error("Invalid data.");
  }

  await prisma.patient.update({
    where: {
      id,
    },

    data: {
      fullName:
        parsed.data.fullName,

      email: parsed.data.email,

      phone: parsed.data.phone,

      birthDate: new Date(
        parsed.data.birthDate
      ),

      document:
        parsed.data.document,

      zipCode:
        parsed.data.zipCode,

      city: parsed.data.city,

      state: parsed.data.state,

      address:
        parsed.data.address,
    },
  });

  revalidatePath(
    "/dashboard/patients"
  );
}

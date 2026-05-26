"use server";

import { revalidatePath } from "next/cache";

import { PatientStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { getCurrentClinic } from "@/lib/auth/get-current-clinic";

import {
  patientSchema,
  type PatientSchema,
} from "../schemas/patient.schema";

export async function createPatient(
  data: PatientSchema
) {
  const parsed =
    patientSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error("Invalid form data.");
  }

  const clinic =
    await getCurrentClinic();

  await prisma.patient.create({
    data: {
      clinicId: clinic.id,
<<<<<<< HEAD
      fullName: parsed.data.fullName,
      email: parsed.data.email,
      phone: parsed.data.phone,
      birthDate: new Date(
        parsed.data.birthDate
      ),
      document: parsed.data.document,
      zipCode: parsed.data.zipCode,
      city: parsed.data.city,
      state: parsed.data.state,
      address: parsed.data.address,
      status: PatientStatus.ACTIVE,
    },
  });

  revalidatePath("/dashboard/patients");
  revalidatePath("/dashboard");
}
=======

      fullName: parsed.data.fullName,

      email: parsed.data.email,

      phone: parsed.data.phone,

      birthDate: new Date(
        parsed.data.birthDate
      ),

      document: parsed.data.document,

      zipCode: parsed.data.zipCode,

      city: parsed.data.city,

      state: parsed.data.state,

      address: parsed.data.address,

      status: PatientStatus.ACTIVE,
    },
  });

  revalidatePath(
    "/dashboard/patients"
  );
}
>>>>>>> 6c2fa94 (feat: implement dashboard foundation and subscriptions module)

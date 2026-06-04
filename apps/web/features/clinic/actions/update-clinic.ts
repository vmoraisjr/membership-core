"use server";

import { assertPermission } from "@/features/rbac/services/assert-permission";

import { revalidatePath } from "next/cache";

import prisma from "@/lib/prisma";

import {
  clinicSchema,
  type ClinicSchema,
} from "../schemas/clinic.schema";

export async function updateClinic(
  id: string,
  data: ClinicSchema
) {
  await assertPermission(
    "clinic",
    "manage"
  );

  const parsed =
    clinicSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error("Invalid data.");
  }

  const clinic =
    await prisma.clinic.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

  if (!clinic) {
    throw new Error("Clinic not found.");
  }

  const slug =
    parsed.data.slug.toLowerCase();

  const conflictingClinic =
    await prisma.clinic.findUnique({
      where: {
        slug,
      },
      select: {
        id: true,
      },
    });

  if (
    conflictingClinic &&
    conflictingClinic.id !== clinic.id
  ) {
    throw new Error(
      "A clinic with this slug already exists."
    );
  }

  await prisma.clinic.update({
    where: {
      id: clinic.id,
    },
    data: {
      name: parsed.data.name,
      brandName:
        parsed.data.brandName || null,
      slug,
      document: parsed.data.document,
      email: parsed.data.email,
      phone: parsed.data.phone,
      zipCode: parsed.data.zipCode,
      city: parsed.data.city,
      state: parsed.data.state,
      address: parsed.data.address,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/clinics");
}

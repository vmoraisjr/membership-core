"use server";

import { assertPermission } from "@/features/rbac/services/assert-permission";

import { revalidatePath } from "next/cache";

import prisma from "@/lib/prisma";

import {
  clinicSchema,
  type ClinicSchema,
} from "../schemas/clinic.schema";

export async function createClinic(
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

  const slug =
    parsed.data.slug.toLowerCase();

  const existingClinic =
    await prisma.clinic.findUnique({
      where: {
        slug,
      },
      select: {
        id: true,
      },
    });

  if (existingClinic) {
    throw new Error(
      "A clinic with this slug already exists."
    );
  }

  await prisma.clinic.create({
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

import { requireCurrentAppUser } from "@/features/auth/services/get-current-app-user";

import prisma from "@/lib/prisma";

export async function getCurrentClinicId() {
  const currentUser =
    await requireCurrentAppUser();

  if (!currentUser.clinicId) {
    throw new Error(
      "The current user is not assigned to a clinic."
    );
  }

  return currentUser.clinicId;
}

export async function getCurrentClinic() {
  const clinicId =
    await getCurrentClinicId();
  const clinic =
    await prisma.clinic.findUnique({
      where: {
        id: clinicId,
      },
    });

  if (!clinic) {
    throw new Error(
      "Current clinic not found."
    );
  }

  return clinic;
}

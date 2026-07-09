import prisma from "@/lib/prisma";
import {
  getClinicWorkspaceBrand,
  getPlatformWorkspaceBrand,
} from "@/lib/branding";

import { requireCurrentAppUser } from "./get-current-app-user";

export async function getWorkspaceBrand() {
  const currentUser =
    await requireCurrentAppUser();

  if (!currentUser.clinicId) {
    return getPlatformWorkspaceBrand();
  }

  const clinic =
    await prisma.clinic.findUnique({
      where: {
        id: currentUser.clinicId,
      },
      select: {
        name: true,
        brandName: true,
        logoUrl: true,
      },
    });

  if (!clinic) {
    return getPlatformWorkspaceBrand();
  }

  return getClinicWorkspaceBrand(clinic);
}

import prisma from "@/lib/prisma";
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";

export async function getLeads() {
  const clinic = await getCurrentClinic();

  return prisma.lead.findMany({
    where: {
      clinicId: clinic.id,
    },
    include: {
      convertedPatient: {
        select: {
          id: true,
          fullName: true,
        },
      },
      notes: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
      _count: {
        select: {
          activities: true,
          notes: true,
        },
      },
    },
    orderBy: [
      {
        createdAt: "desc",
      },
      {
        fullName: "asc",
      },
    ],
  });
}

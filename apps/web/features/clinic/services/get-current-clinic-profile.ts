import prisma from "@/lib/prisma";
import { getCurrentClinicId } from "@/lib/auth/get-current-clinic";

export async function getCurrentClinicProfile() {
  const clinicId =
    await getCurrentClinicId();

  return prisma.clinic.findUniqueOrThrow({
    where: {
      id: clinicId,
    },
    include: {
      clinicSubscriptions: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
        include: {
          clinicBillingPlan: true,
          invoices: {
            orderBy: {
              dueDate: "desc",
            },
            take: 1,
          },
        },
      },
      appUsers: {
        where: {
          isClinicMaster: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          lastLoginAt: true,
          mustChangePassword: true,
        },
        take: 1,
      },
    },
  });
}

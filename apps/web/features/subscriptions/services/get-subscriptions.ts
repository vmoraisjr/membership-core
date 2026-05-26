import { prisma } from "@/lib/prisma";
<<<<<<< HEAD
import { getCurrentClinic } from "@/lib/auth/get-current-clinic";

export async function getSubscriptions() {
  const clinic = await getCurrentClinic();

  return prisma.subscription.findMany({
    where: {
      patient: {
        clinicId: clinic.id,
      },
    },
=======

export async function getSubscriptions() {
  return prisma.subscription.findMany({
>>>>>>> 6c2fa94 (feat: implement dashboard foundation and subscriptions module)
    include: {
      patient: true,
      membershipPlan: true,
    },
<<<<<<< HEAD
=======

>>>>>>> 6c2fa94 (feat: implement dashboard foundation and subscriptions module)
    orderBy: {
      startedAt: "desc",
    },
  });
<<<<<<< HEAD
}
=======
}
>>>>>>> 6c2fa94 (feat: implement dashboard foundation and subscriptions module)

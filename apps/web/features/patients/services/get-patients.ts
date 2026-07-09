import prisma from "@/lib/prisma";
import { getCurrentClinicContext } from "@/lib/auth/tenant";
import { filterByClinic } from "@/lib/auth/tenant";
import { MANAGEABLE_SUBSCRIPTION_STATUSES } from "@/features/subscriptions/constants/manageable-subscription-statuses";

export async function getPatients() {
  const { clinicId } =
    await getCurrentClinicContext();

  const patients = await prisma.patient.findMany({
    where: filterByClinic(clinicId),
    include: {
      responsiblePatient: {
        select: {
          id: true,
          fullName: true,
          document: true,
        },
      },
      subscriptions: {
        include: {
          membershipPlan: true,
        },
        orderBy: {
          startedAt: "desc",
        },
      },
    },
    orderBy: {
      fullName: "asc",
    },
  });

  return patients.map((patient) => {
    const ownCurrentSubscription =
      patient.subscriptions.find(
        (subscription) =>
          MANAGEABLE_SUBSCRIPTION_STATUSES.some(
            (status) =>
              status ===
              subscription.status
          )
      ) ??
      patient.subscriptions[0] ??
      null;

    const inheritedCurrentSubscription =
      patient.responsiblePatient?.id
        ? patients
            .find(
              (candidate) =>
                candidate.id ===
                patient.responsiblePatientId
            )
            ?.subscriptions.find(
              (subscription) =>
                MANAGEABLE_SUBSCRIPTION_STATUSES.some(
                  (status) =>
                    status ===
                    subscription.status
                )
            ) ??
          patients
            .find(
              (candidate) =>
                candidate.id ===
                patient.responsiblePatientId
            )
            ?.subscriptions[0] ??
          null
        : null;

    return {
      ...patient,
      currentSubscription:
        patient.kind ===
        "DEPENDENT"
          ? inheritedCurrentSubscription
          : ownCurrentSubscription,
      subscriptionSourcePatientId:
        patient.kind ===
          "DEPENDENT" &&
        patient.responsiblePatientId
          ? patient.responsiblePatientId
          : patient.id,
    };
  });
}

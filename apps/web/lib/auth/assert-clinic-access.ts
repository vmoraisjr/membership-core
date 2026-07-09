import { requireCurrentAppUser } from "@/features/auth/services/get-current-app-user";

type AssertClinicAccessInput = {
  clinicId: string | null | undefined;
  message?: string;
};

export async function assertClinicAccess({
  clinicId,
  message = "You do not have access to this clinic.",
}: AssertClinicAccessInput) {
  const currentUser =
    await requireCurrentAppUser();

  if (!clinicId) {
    throw new Error(message);
  }

  if (!currentUser.clinicId) {
    return {
      clinicId,
    };
  }

  if (
    clinicId !== currentUser.clinicId
  ) {
    throw new Error(message);
  }

  return {
    clinicId,
  };
}

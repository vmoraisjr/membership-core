import { getCurrentClinicContext } from "./tenant";

type AssertClinicAccessInput = {
  clinicId: string | null | undefined;
  message?: string;
};

export async function assertClinicAccess({
  clinicId,
  message = "You do not have access to this clinic.",
}: AssertClinicAccessInput) {
  const currentClinic =
    await getCurrentClinicContext();

  if (
    !clinicId ||
    clinicId !== currentClinic.clinicId
  ) {
    throw new Error(message);
  }

  return currentClinic;
}

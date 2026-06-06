import { getCurrentClinic } from "./get-current-clinic";

type AnyWhereInput = Record<
  string,
  unknown
>;

export async function getCurrentClinicContext() {
  const clinic = await getCurrentClinic();

  return {
    clinic,
    clinicId: clinic.id,
  };
}

export function filterByClinic<
  TWhere extends AnyWhereInput,
>(
  clinicId: string,
  where?: TWhere
) {
  return {
    ...(where ?? ({} as TWhere)),
    clinicId,
  };
}

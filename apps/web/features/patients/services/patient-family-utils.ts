export function normalizeDigits(
  value: string
) {
  return value.replace(/\D/g, "");
}

export function getPatientAge(
  birthDate: Date
) {
  const today = new Date();
  let age =
    today.getFullYear() -
    birthDate.getFullYear();
  const monthDiff =
    today.getMonth() -
    birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 &&
      today.getDate() <
        birthDate.getDate())
  ) {
    age -= 1;
  }

  return age;
}

export function isMinorPatient(
  birthDate: Date
) {
  return getPatientAge(birthDate) < 18;
}

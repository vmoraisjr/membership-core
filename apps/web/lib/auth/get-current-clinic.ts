import { prisma } from "@/lib/prisma";

export async function getCurrentClinic() {
  const clinic =
    await prisma.clinic.findFirst();

  if (!clinic) {
    throw new Error(
      "Clinic not found."
    );
  }

  return clinic;
}
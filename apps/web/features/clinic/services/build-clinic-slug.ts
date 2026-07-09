import prisma from "@/lib/prisma";

import { slugifyClinicName } from "./clinic-formats";

type Options = {
  excludeClinicId?: string;
};

export async function buildUniqueClinicSlug(
  input: string,
  options: Options = {}
) {
  const baseSlug = slugifyClinicName(input);
  let candidate = baseSlug;
  let suffix = 2;

  while (true) {
    const existingClinic =
      await prisma.clinic.findFirst({
        where: {
          slug: candidate,
          NOT: options.excludeClinicId
            ? {
                id: options.excludeClinicId,
              }
            : undefined,
        },
        select: {
          id: true,
        },
      });

    if (!existingClinic) {
      return candidate;
    }

    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

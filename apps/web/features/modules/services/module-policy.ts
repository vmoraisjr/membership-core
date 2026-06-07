import { ModuleKey } from "@prisma/client";

export const V1_ACTIVE_MODULE_KEYS = [
  ModuleKey.MEMBERSHIP,
] as const;

export function isModuleV1Active(
  key: ModuleKey
) {
  return V1_ACTIVE_MODULE_KEYS.includes(
    key as
      | (typeof V1_ACTIVE_MODULE_KEYS)[number]
  );
}

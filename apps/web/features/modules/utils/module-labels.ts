import { ModuleKey } from "@prisma/client";

import { getTranslations } from "@/i18n/messages";

export function getModuleKeyLabel(
  key: ModuleKey
) {
  const t = getTranslations();

  return t(`modules.keys.${key}.name`);
}

export function getModuleKeyDescription(
  key: ModuleKey
) {
  const t = getTranslations();

  return t(
    `modules.keys.${key}.description`
  );
}

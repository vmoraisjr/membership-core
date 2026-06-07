import { ShieldAlert } from "lucide-react";

import { SectionCard } from "@/components/dashboard/section-card";
import { getTranslations } from "@/i18n/messages";

type Props = {
  title: string;
  description: string;
};

export function AccessDenied({
  title,
  description,
}: Props) {
  const t = getTranslations();

  return (
    <SectionCard
      title={title}
      description={description}
    >
      <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <ShieldAlert className="size-5" />
        {t("accessDenied.message")}
      </div>
    </SectionCard>
  );
}

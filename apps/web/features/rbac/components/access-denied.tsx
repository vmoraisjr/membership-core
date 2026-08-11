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
      <div className="flex items-center gap-3 rounded-xl border border-transparent bg-[color:var(--color-warning-soft)] p-4 text-sm text-[color:var(--color-warning)]">
        <ShieldAlert className="size-5 shrink-0" />
        {t("accessDenied.message")}
      </div>
    </SectionCard>
  );
}

import { ShieldAlert } from "lucide-react";

import { SectionCard } from "@/components/dashboard/section-card";

type Props = {
  title: string;
  description: string;
};

export function AccessDenied({
  title,
  description,
}: Props) {
  return (
    <SectionCard
      title={title}
      description={description}
    >
      <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <ShieldAlert className="size-5" />
        Access is restricted for the current role.
      </div>
    </SectionCard>
  );
}

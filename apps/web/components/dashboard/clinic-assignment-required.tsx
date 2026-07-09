import Link from "next/link";

import { SectionCard } from "@/components/dashboard/section-card";
import { Button } from "@/components/ui/button";
import { getTranslations } from "@/i18n/messages";

export function ClinicAssignmentRequired() {
  const t = getTranslations();

  return (
    <SectionCard
      title={t("clinicAssignment.title")}
      description={t("clinicAssignment.description")}
    >
      <div className="p-4">
        <Button asChild>
          <Link href="/dashboard/clinics">
            {t("clinicAssignment.action")}
          </Link>
        </Button>
      </div>
    </SectionCard>
  );
}

import { AuditLogPage } from "@/features/audit-log/components/audit-log-page";

type PageProps = {
  searchParams: Promise<{
    actor?: string;
    entity?: string;
    date?: string;
    clinicId?: string;
  }>;
};

export default async function Page({
  searchParams,
}: PageProps) {
  const resolvedSearchParams =
    await searchParams;

  return (
    <AuditLogPage
      filters={{
        actor:
          resolvedSearchParams.actor,
        entity:
          resolvedSearchParams.entity,
        date: resolvedSearchParams.date,
        clinicId:
          resolvedSearchParams.clinicId,
      }}
    />
  );
}

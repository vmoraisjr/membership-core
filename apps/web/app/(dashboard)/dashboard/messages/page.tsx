import { SupportThreadsPage } from "@/features/messages/components/support-threads-page";

type PageProps = {
  searchParams: Promise<{
    threadId?: string;
    category?: string;
    status?: string;
    clinicId?: string;
  }>;
};

export default async function MessagesPage({
  searchParams,
}: PageProps) {
  const resolvedSearchParams =
    await searchParams;

  return (
    <SupportThreadsPage
      filters={{
        threadId:
          resolvedSearchParams.threadId,
        category:
          resolvedSearchParams.category,
        status:
          resolvedSearchParams.status,
        clinicId:
          resolvedSearchParams.clinicId,
      }}
    />
  );
}

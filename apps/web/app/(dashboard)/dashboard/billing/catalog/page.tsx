import { PlatformCommercialCatalogPage } from "@/features/billing/components/platform-commercial-catalog-page";

type Props = {
  searchParams: Promise<{
    query?: string;
    availability?: string;
  }>;
};

export default async function Page({
  searchParams,
}: Props) {
  const params = await searchParams;

  return (
    <PlatformCommercialCatalogPage
      filters={{
        query: params.query,
        availability:
          params.availability,
      }}
    />
  );
}

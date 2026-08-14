import { RouteTabs } from "@/components/dashboard/route-tabs";
import { ModulesPage } from "@/features/modules/components/modules-page";
import { PlatformCommercialCatalogPage } from "@/features/billing/components/platform-commercial-catalog-page";
import { planosComerciaisUrl } from "@/lib/owner-routes";

type Props = {
  searchParams: Promise<{
    tab?: string;
    query?: string;
    availability?: string;
  }>;
};

export default async function PlanosComerciaisRoute({
  searchParams,
}: Props) {
  const resolved = await searchParams;
  const tab =
    resolved.tab === "modules"
      ? "modules"
      : "plans";

  return (
    <>
      <RouteTabs
        active={tab}
        tabs={[
          {
            id: "plans",
            label: "Planos",
            href: planosComerciaisUrl({
              tab: "plans",
            }),
          },
          {
            id: "modules",
            label: "Módulos incluídos",
            href: planosComerciaisUrl({
              tab: "modules",
            }),
          },
        ]}
      />

      {tab === "plans" ? (
        <PlatformCommercialCatalogPage
          filters={{
            query: resolved.query,
            availability:
              resolved.availability,
          }}
        />
      ) : (
        <ModulesPage />
      )}
    </>
  );
}

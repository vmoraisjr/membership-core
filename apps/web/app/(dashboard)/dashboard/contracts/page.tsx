import { ContractsPage } from "@/features/contracts/components/contracts-page";
import { renderClinicScopedPage } from "@/features/shared/components/render-clinic-scoped-page";

export default async function Page() {
  return renderClinicScopedPage(
    <ContractsPage />
  );
}

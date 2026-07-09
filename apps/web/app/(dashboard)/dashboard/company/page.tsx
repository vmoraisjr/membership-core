import { CompanyProfilePage } from "@/features/clinic/components/company-profile-page";
import { renderClinicScopedPage } from "@/features/shared/components/render-clinic-scoped-page";

export default async function Page() {
  return renderClinicScopedPage(
    <CompanyProfilePage />
  );
}

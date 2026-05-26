import { getPatients } from "../services/get-patients";

import { DashboardPage } from "@/components/layout/dashboard-page";
import { PageHeader } from "@/components/dashboard/page-header";

import { PatientsTable } from "./patients-table";

import { CreatePatientDialog } from "./create-patient-dialog";

export async function PatientsPage() {
  const patients =
    await getPatients();

  return (
    <DashboardPage>
      <PageHeader
        title="Patients"
        description="Manage clinic patients, keep member records organized, and prepare the foundation for subscriptions."
        action={<CreatePatientDialog />}
      />
      <PatientsTable patients={patients} />
    </DashboardPage>
  );
}

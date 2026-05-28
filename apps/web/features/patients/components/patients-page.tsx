import { getPatients } from "../services/get-patients";

import { DashboardPage } from "@/components/dashboard/dashboard-page";

import { PageHeader } from "@/components/dashboard/page-header";

import { PatientsTable } from "./patients-table";

import { PatientDialog } from "./patient-dialog";

export async function PatientsPage() {
  const patients =
    await getPatients();

  return (
    <DashboardPage>
      <PageHeader
        title="Patients"
        description="Manage clinic patients, keep member records organized, and prepare the foundation for subscriptions."
        action={<PatientDialog />}
      />

      <PatientsTable
        patients={patients}
      />
    </DashboardPage>
  );
}
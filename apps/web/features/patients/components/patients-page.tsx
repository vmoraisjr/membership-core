import { getPatients } from "../services/get-patients";
import { getMembershipPlans } from "@/features/membership-plans/services/get-membership-plans";

import { DashboardPage } from "@/components/layout/dashboard-page";

import { PageHeader } from "@/components/dashboard/page-header";

import { PatientsTable } from "./patients-table";

import { PatientDialog } from "./patient-dialog";

export async function PatientsPage() {
  const [patients, plans] = await Promise.all([
    getPatients(),
    getMembershipPlans(),
  ]);

  return (
    <DashboardPage>
      <PageHeader
        title="Patients"
        description="Manage active and inactive patients, review their current plan, and create subscriptions from the patient roster."
        action={<PatientDialog />}
      />

      <PatientsTable
        patients={patients}
        plans={plans.map((p) => ({ id: p.id, name: p.name }))}
      />
    </DashboardPage>
  );
}

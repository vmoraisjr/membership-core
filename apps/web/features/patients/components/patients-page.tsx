import { getPatients } from "../services/get-patients";
import { getSubscriptionFormOptions } from "@/features/subscriptions/services/get-subscription-form-options";

import { DashboardPage } from "@/components/dashboard/dashboard-page";

import { PageHeader } from "@/components/dashboard/page-header";

import { PatientsTable } from "./patients-table";

import { PatientDialog } from "./patient-dialog";

export async function PatientsPage() {
  const [patients, subscriptionFormOptions] =
    await Promise.all([
      getPatients(),
      getSubscriptionFormOptions(),
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
        plans={
          subscriptionFormOptions.membershipPlans
        }
      />
    </DashboardPage>
  );
}

import { getPatients } from "../services/get-patients";

import { PatientsTable } from "./patients-table";

import { CreatePatientDialog } from "./create-patient-dialog";

export async function PatientsPage() {
  const patients =
    await getPatients();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Patients
          </h1>

          <p className="text-muted-foreground">
            Manage clinic patients.
          </p>
        </div>

        <CreatePatientDialog />
      </div>

      <PatientsTable patients={patients} />
    </div>
  );
}
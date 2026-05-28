import { EmptyState } from "@/components/dashboard/empty-state";
import { DataTableContainer } from "@/components/dashboard/data-table-container";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PatientRowActions } from "./patient-row-actions";

import type {
  Patient,
} from "@prisma/client";

type Props = {
  patients: Patient[];
};

export function PatientsTable({
  patients,
}: Props) {
  return (
    <DataTableContainer
      title="Patient Directory"
      description="A tenant-scoped list of patients registered under the current clinic."
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>

            <TableHead>Email</TableHead>

            <TableHead>City</TableHead>

            <TableHead>State</TableHead>

            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {patients.map((patient) => (
            <TableRow key={patient.id}>
              <TableCell className="font-medium">
                {patient.fullName}
              </TableCell>

              <TableCell>
                {patient.email}
              </TableCell>

              <TableCell>
                {patient.city}
              </TableCell>

              <TableCell>
                {patient.state}
              </TableCell>

              <TableCell className="text-right">
  <PatientRowActions
    patient={{
      id: patient.id,
      fullName:patient.fullName,
      email: patient.email,
      phone: patient.phone,
      birthDate:  patient.birthDate,
      document: patient.document,
      zipCode: patient.zipCode,
      city: patient.city,
      state: patient.state,
      address: patient.address,
    }}
  />
</TableCell>

            </TableRow>
          ))}

          {patients.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="p-0">
                <EmptyState
                  title="No patients yet"
                  description="Create the first patient record for this clinic to start linking subscriptions and benefit usage."
                />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </DataTableContainer>
  );
}

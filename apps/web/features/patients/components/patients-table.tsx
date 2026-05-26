import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Patient = {
  id: string;

  fullName: string;

  email: string;

  city: string;

  state: string;
};

type Props = {
  patients: Patient[];
};

export function PatientsTable({
  patients,
}: Props) {
  return (
    <div className="border rounded-xl">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>

            <TableHead>Email</TableHead>

            <TableHead>City</TableHead>

            <TableHead>State</TableHead>
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
            </TableRow>
          ))}

          {patients.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-center py-10 text-muted-foreground"
              >
                No patients found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
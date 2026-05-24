import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Plan = {
  id: string;
  name: string;
  description: string | null;
  monthlyPrice: number | null;
};

type Props = {
  plans: Plan[];
};

export function PlansTable({
  plans,
}: Props) {
  return (
    <div className="border rounded-xl">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>

            <TableHead>Description</TableHead>

            <TableHead>Monthly Price</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {plans.map((plan) => (
            <TableRow key={plan.id}>
              <TableCell className="font-medium">
                {plan.name}
              </TableCell>

              <TableCell>
                {plan.description}
              </TableCell>

              <TableCell>
                R$ {plan.monthlyPrice}
              </TableCell>
            </TableRow>
          ))}

          {plans.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={3}
                className="text-center py-10 text-muted-foreground"
              >
                No plans found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
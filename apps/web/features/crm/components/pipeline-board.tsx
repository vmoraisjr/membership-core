type LeadBoardItem = {
  id: string;
  fullName: string;
  city: string;
  state: string;
  status:
    | "NEW"
    | "CONTACTED"
    | "PROPOSAL"
    | "NEGOTIATION"
    | "WON"
    | "LOST";
  convertedPatient: {
    id: string;
    fullName: string;
  } | null;
};

type Props = {
  leads: LeadBoardItem[];
};

const pipelineColumns = [
  {
    key: "NEW",
    label: "New",
  },
  {
    key: "CONTACTED",
    label: "Contacted",
  },
  {
    key: "PROPOSAL",
    label: "Proposal",
  },
  {
    key: "NEGOTIATION",
    label: "Negotiation",
  },
  {
    key: "WON",
    label: "Won",
  },
  {
    key: "LOST",
    label: "Lost",
  },
] as const;

export function PipelineBoard({
  leads,
}: Props) {
  return (
    <section className="grid gap-4 xl:grid-cols-6">
      {pipelineColumns.map((column) => {
        const columnLeads =
          leads.filter(
            (lead) =>
              lead.status === column.key
          );

        return (
          <div
            key={column.key}
            className="rounded-xl border bg-card p-4"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold">
                {column.label}
              </h2>
              <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium">
                {columnLeads.length}
              </span>
            </div>

            <div className="space-y-3">
              {columnLeads.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No leads
                </p>
              ) : (
                columnLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="rounded-lg border bg-background p-3"
                  >
                    <div className="font-medium">
                      {lead.fullName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {lead.city}, {lead.state}
                    </div>
                    {lead.convertedPatient ? (
                      <div className="mt-2 text-xs text-emerald-700">
                        Converted
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}

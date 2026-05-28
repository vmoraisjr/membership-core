import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type Props = {
  onEdit: () => void;

  onDelete: () => void;
};

export function TableActions({
  onEdit,
  onDelete,
}: Props) {
  return (
    <div className="flex items-center gap-2">
      <Button
        size="icon"
        variant="outline"
        onClick={onEdit}
      >
        <Pencil className="size-4" />
      </Button>

      <Button
        size="icon"
        variant="destructive"
        onClick={onDelete}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
import Button from "../../../components/ui/Button";
import type { PosCategory } from "../../../types/pos";

type Row = PosCategory & { count: number };

export default function CategoryActions({
  row,
  onEdit,
  onDelete,
}: {
  row: Row;
  onEdit: (c: PosCategory) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="secondary"
        className="py-1.5! px-3! text-xs!"
        onClick={() => onEdit(row)}
      >
        Edit
      </Button>
      <Button
        variant="danger"
        className="py-1.5! px-3! text-xs!"
        onClick={() => onDelete(row.id)}
      >
        Delete
      </Button>
    </div>
  );
}

import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import ModalFrame from "../../../components/ui/ModalFrame";

export default function CategoryModal({
  open,
  isEdit,
  name,
  onNameChange,
  onClose,
  onSave,
}: {
  open: boolean;
  isEdit: boolean;
  name: string;
  onNameChange: (v: string) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <ModalFrame open={open} onClose={onClose}>
      <Card className="p-6 shadow-xl">
        <h2 className="text-lg font-extrabold">
          {isEdit ? "Edit category" : "New category"}
        </h2>
        <label className="block mt-4">
          <span className="text-xs font-bold text-neutral-600">Name</span>
          <input
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-600/25"
            placeholder="Coffee"
            autoFocus={open}
          />
        </label>
        <div className="mt-6 flex gap-2 justify-end">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave}>Save</Button>
        </div>
      </Card>
    </ModalFrame>
  );
}

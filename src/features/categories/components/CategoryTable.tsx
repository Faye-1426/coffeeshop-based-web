import Card from "../../../components/ui/Card";
import TableBodyLoadingRow from "../../../components/ui/TableBodyLoadingRow";
import type { PosCategory } from "../../../types/pos";
import CategoryActions from "./CategoryActions";

type Row = PosCategory & { count: number };

export default function CategoryTable({
  rows,
  loading,
  onEdit,
  onDelete,
}: {
  rows: Row[];
  loading?: boolean;
  onEdit: (c: PosCategory) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-5 py-3 font-extrabold text-neutral-900">
                Name
              </th>
              <th className="px-5 py-3 font-extrabold text-neutral-900">
                Items
              </th>
              <th className="px-5 py-3 font-extrabold text-neutral-900 w-48">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableBodyLoadingRow colSpan={3} label="Memuat kategori…" />
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-5 py-10 text-center text-neutral-500"
                >
                  Tidak ada kategori.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/80"
                >
                  <td className="px-5 py-3 font-semibold text-neutral-900">
                    {row.name}
                  </td>
                  <td className="px-5 py-3 text-neutral-600">{row.count}</td>
                  <td className="px-5 py-3">
                    <CategoryActions
                      row={row}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

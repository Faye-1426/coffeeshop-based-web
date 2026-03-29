import ListLoadingStatus from "./ListLoadingStatus";

export default function TableBodyLoadingRow({
  colSpan,
  label,
}: {
  colSpan: number;
  label: string;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="p-0">
        <ListLoadingStatus label={label} variant="inline" />
      </td>
    </tr>
  );
}

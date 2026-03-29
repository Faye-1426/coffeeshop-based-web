import Card from "../../../components/ui/Card";

const chartBars = [42, 65, 48, 72, 55, 80, 38];

export default function SalesTrendPlaceholder() {
  return (
    <Card className="p-5 lg:col-span-2">
      <div className="font-extrabold text-neutral-900 mb-4">
        Sales trend (placeholder)
      </div>
      <div className="flex items-end gap-2 h-40 pt-4 border-t border-neutral-100">
        {chartBars.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-lg bg-red-600/70 transition hover:bg-red-600 min-w-0"
            style={{ height: `${h}%` }}
            title={`Day ${i + 1}`}
          />
        ))}
      </div>
      <p className="mt-3 text-xs text-neutral-500">
        Statis untuk demo — nanti hubungkan data real.
      </p>
    </Card>
  );
}

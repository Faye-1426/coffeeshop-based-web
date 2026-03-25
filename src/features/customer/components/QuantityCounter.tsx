import { Minus, Plus } from "lucide-react";

export default function QuantityCounter({
  value,
  onChange,
  min = 1,
  max = 99,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="h-10 w-10 rounded-full border border-neutral-200 bg-white flex items-center justify-center hover:bg-neutral-50 transition"
        aria-label="Decrease quantity"
        disabled={value <= min}
      >
        <Minus size={16} />
      </button>
      <div className="min-w-10 text-center font-extrabold text-neutral-900">
        {value}
      </div>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="h-10 w-10 rounded-full border border-neutral-200 bg-white flex items-center justify-center hover:bg-neutral-50 transition"
        aria-label="Increase quantity"
        disabled={value >= max}
      >
        <Plus size={16} />
      </button>
    </div>
  );
}


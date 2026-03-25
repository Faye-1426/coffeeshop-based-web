import type { VariantGroup, ProductVariantSelection } from "../types";

export default function VariantGroupSelector({
  group,
  selection,
  onPick,
}: {
  group: VariantGroup;
  selection: ProductVariantSelection;
  onPick: (groupId: string, optionId: string) => void;
}) {
  const picked = selection[group.id];

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white/80 p-4">
      <div className="font-extrabold text-neutral-900 text-sm">{group.name}</div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {group.options.map((opt) => {
          const isActive = opt.id === picked;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onPick(group.id, opt.id)}
              className={[
                "rounded-2xl border px-3 py-2 text-left transition",
                isActive
                  ? "bg-red-600 border-red-600 text-white"
                  : "bg-white border-neutral-200 text-neutral-800 hover:bg-neutral-50",
              ].join(" ")}
            >
              <div className="font-bold text-sm">{opt.label}</div>
              {opt.priceDelta !== 0 ? (
                <div
                  className={[
                    "text-[11px] mt-1 font-extrabold",
                    isActive ? "text-white/90" : "text-neutral-500",
                  ].join(" ")}
                >
                  {opt.priceDelta > 0 ? "+" : "-"}Rp{" "}
                  {Math.abs(opt.priceDelta).toLocaleString("id-ID")}
                </div>
              ) : (
                <div className={isActive ? "text-[11px] mt-1 text-white/85" : "hidden"}>
                  +Rp 0
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}


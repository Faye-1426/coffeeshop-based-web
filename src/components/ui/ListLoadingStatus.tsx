import { Loader2 } from "lucide-react";

/** Spinner + teks. `block`: area di atas grid / di dalam card. `inline`: rapat untuk sel tabel. */
export default function ListLoadingStatus({
  label,
  variant = "block",
  className = "",
}: {
  label: string;
  variant?: "block" | "inline";
  className?: string;
}) {
  const wrap =
    variant === "inline"
      ? "flex items-center justify-center gap-2.5 py-8 text-sm font-medium text-neutral-600"
      : "flex items-center gap-2.5 py-5 text-sm font-medium text-neutral-600";
  return (
    <div
      className={`${wrap} ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-busy
    >
      <Loader2
        className="h-5 w-5 animate-spin text-red-600 shrink-0"
        aria-hidden
      />
      <span>{label}</span>
    </div>
  );
}

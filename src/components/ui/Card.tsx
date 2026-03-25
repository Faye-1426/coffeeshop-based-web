import type { ReactNode } from "react";

export default function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-2xl border border-neutral-200 bg-white/90 shadow-sm",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

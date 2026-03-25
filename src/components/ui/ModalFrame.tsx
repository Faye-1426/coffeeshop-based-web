import type { ReactNode } from "react";

type ModalFrameProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Wider panel (e.g. product form). */
  maxWidthClass?: string;
};

/** Center / bottom sheet modal with open/close transitions; keep mounted and drive with `open`. */
export default function ModalFrame({
  open,
  onClose,
  children,
  maxWidthClass = "max-w-md",
}: ModalFrameProps) {
  return (
    <div
      className={[
        "fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4",
        "transition-opacity duration-300 ease-out",
        open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
      ].join(" ")}
      aria-hidden={!open}
    >
      <button
        type="button"
        className={[
          "absolute inset-0 bg-black/40 transition-opacity duration-300 ease-out",
          open ? "opacity-100" : "opacity-0",
        ].join(" ")}
        aria-label="Close dialog"
        onClick={onClose}
      />

      <div
        className={[
          "relative z-10 w-full",
          maxWidthClass,
          "transform transition-all duration-300 ease-out",
          open
            ? "translate-y-0 opacity-100 sm:scale-100"
            : "translate-y-8 opacity-0 sm:translate-y-0 sm:scale-[0.97]",
        ].join(" ")}
      >
        {children}
      </div>
    </div>
  );
}

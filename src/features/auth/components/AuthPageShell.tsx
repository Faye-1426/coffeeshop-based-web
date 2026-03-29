import type { ReactNode } from "react";
import { Coffee } from "lucide-react";

export default function AuthPageShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-12 bg-linear-to-b from-neutral-100 to-neutral-50">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center gap-2 mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600 text-white shadow-lg shadow-red-600/25">
            <Coffee className="h-8 w-8" aria-hidden />
          </div>
          <h1 className="text-2xl font-extrabold text-neutral-900">{title}</h1>
          <p className="text-sm text-neutral-600">{subtitle}</p>
        </div>
        {children}
        {footer ? <div className="mt-6 text-center">{footer}</div> : null}
      </div>
    </div>
  );
}

import { Navigate } from "react-router-dom";
import { tenantSlugToStoreKey } from "./lib/storePath";

/**
 * `/` → `/${VITE_CUSTOMER_DEFAULT_TENANT_SLUG}-store` when env is set.
 */
export default function CustomerRootRedirect() {
  const raw = import.meta.env.VITE_CUSTOMER_DEFAULT_TENANT_SLUG as
    | string
    | undefined;
  const slug = raw?.trim();
  if (slug) {
    return <Navigate to={`/${tenantSlugToStoreKey(slug)}`} replace />;
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-16 text-center">
      <p className="text-neutral-600 text-sm">
        Set <code className="font-mono text-xs">VITE_CUSTOMER_DEFAULT_TENANT_SLUG</code>{" "}
        in <code className="font-mono text-xs">.env</code> to redirect from{" "}
        <code className="font-mono text-xs">/</code>, or open a store URL directly
        (e.g. <code className="font-mono text-xs">/your-slug-store</code>).
      </p>
    </div>
  );
}

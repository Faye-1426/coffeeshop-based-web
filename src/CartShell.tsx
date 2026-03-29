import { useLocation } from "react-router-dom";
import CartDrawer from "./features/customer/components/CartDrawer";
import FloatingCartButton from "./features/customer/components/FloatingCartButton";
import { CUSTOMER_STORE_SUFFIX } from "./features/customer/lib/storePath";

/** Customer storefront cart — only on marketplace `/:storeKey` routes (e.g. `warkop-store`). */
export default function CartShell() {
  const { pathname } = useLocation();
  if (pathname.startsWith("/pos")) return null;
  if (pathname === "/login" || pathname === "/signup") return null;
  const first = pathname.split("/").filter(Boolean)[0];
  if (!first?.endsWith(CUSTOMER_STORE_SUFFIX)) return null;
  return (
    <>
      <CartDrawer />
      <FloatingCartButton />
    </>
  );
}

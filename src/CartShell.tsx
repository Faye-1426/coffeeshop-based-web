import { useLocation } from "react-router-dom";
import CartDrawer from "./features/customer/components/CartDrawer";
import FloatingCartButton from "./features/customer/components/FloatingCartButton";

/** Customer storefront cart — hidden on POS admin routes. */
export default function CartShell() {
  const { pathname } = useLocation();
  if (pathname.startsWith("/pos")) return null;
  if (pathname === "/login" || pathname === "/signup") return null;
  return (
    <>
      <CartDrawer />
      <FloatingCartButton />
    </>
  );
}

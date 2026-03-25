import { Navigate, Route, Routes } from "react-router-dom";
import WarcoopMenuPage from "./features/customer/WarcoopMenuPage";
import CheckoutPage from "./features/customer/CheckoutPage";
import OrderSuccessPage from "./features/customer/OrderSuccessPage";
import CartDrawer from "./features/customer/components/CartDrawer";
import FloatingCartButton from "./features/customer/components/FloatingCartButton";

export default function App() {
  return (
    <div className="min-h-dvh bg-neutral-50 text-neutral-900 px-10 py-6">
      <Routes>
        <Route path="/" element={<WarcoopMenuPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order-success" element={<OrderSuccessPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <CartDrawer />
      <FloatingCartButton />
    </div>
  );
}

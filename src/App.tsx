import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import WarcoopMenuPage from "./features/customer/WarcoopMenuPage";
import CheckoutPage from "./features/customer/CheckoutPage";
import OrderSuccessPage from "./features/customer/OrderSuccessPage";
import PosLayout from "./components/layout/PosLayout";
import DashboardPage from "./features/dashboard/pages/DashboardPage";
import CategoriesPage from "./features/categories/pages/CategoriesPage";
import ProductsPage from "./features/products/pages/ProductsPage";
import OrdersPage from "./features/orders/pages/OrdersPage";
import TransactionsPage from "./features/transactions/pages/TransactionsPage";
import OutstandingPage from "./features/outstanding/pages/OutstandingPage";
import AccountPage from "./features/account/pages/AccountPage";
import LoginPage from "./features/auth/pages/LoginPage";
import SignupPage from "./features/auth/pages/SignupPage";
import CartShell from "./CartShell";

function CustomerShell({ children }: { children: ReactNode }) {
  return <div className="px-10 py-6">{children}</div>;
}

export default function App() {
  return (
    <div className="min-h-dvh bg-neutral-50 text-neutral-900">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        <Route path="/pos" element={<PosLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="outstanding" element={<OutstandingPage />} />
          <Route path="account" element={<AccountPage />} />
        </Route>

        <Route
          path="/"
          element={
            <CustomerShell>
              <WarcoopMenuPage />
            </CustomerShell>
          }
        />
        <Route
          path="/checkout"
          element={
            <CustomerShell>
              <CheckoutPage />
            </CustomerShell>
          }
        />
        <Route
          path="/order-success"
          element={
            <CustomerShell>
              <OrderSuccessPage />
            </CustomerShell>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <CartShell />
    </div>
  );
}

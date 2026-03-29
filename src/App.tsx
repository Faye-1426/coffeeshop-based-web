import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import WarcoopMenuPage from "./features/customer/WarcoopMenuPage";
import CheckoutPage from "./features/customer/CheckoutPage";
import OrderSuccessPage from "./features/customer/OrderSuccessPage";
import PosLayout from "./components/layout/PosLayout";
import PosIndexRedirect from "./components/PosIndexRedirect";
import Category from "./features/categories/Category";
import Product from "./features/products/Product";
import Order from "./features/orders/Order";
import Transaction from "./features/transactions/Transaction";
import Outstanding from "./features/outstanding/Outstanding";
import Account from "./features/account/Account";
import SuperDashboard from "./features/super/SuperDashboard";
import SuperTenants from "./features/super/SuperTenants";
import SuperTenantNew from "./features/super/SuperTenantNew";
import SuperTenantDetail from "./features/super/SuperTenantDetail";
import SuperTenantAccount from "./features/super/SuperTenantAccount";
import SuperSubscriptions from "./features/super/SuperSubscriptions";
import SuperSettings from "./features/super/SuperSettings";
import Login from "./features/auth/Login";
import Signup from "./features/auth/Signup";
import CartShell from "./CartShell";

function CustomerShell({ children }: { children: ReactNode }) {
  return <div className="px-10 py-6">{children}</div>;
}

export default function App() {
  return (
    <div className="min-h-dvh bg-neutral-50 text-neutral-900">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route path="/pos" element={<PosLayout />}>
          <Route index element={<PosIndexRedirect />} />
          <Route path="categories" element={<Category />} />
          <Route path="products" element={<Product />} />
          <Route path="orders" element={<Order />} />
          <Route path="transactions" element={<Transaction />} />
          <Route path="outstanding" element={<Outstanding />} />
          <Route path="account" element={<Account />} />
          <Route path="super/dashboard" element={<SuperDashboard />} />
          <Route path="super/tenants" element={<SuperTenants />} />
          <Route path="super/tenants/new" element={<SuperTenantNew />} />
          <Route path="super/tenants/:tenantId/account" element={<SuperTenantAccount />} />
          <Route path="super/tenants/:id" element={<SuperTenantDetail />} />
          <Route path="super/subscriptions" element={<SuperSubscriptions />} />
          <Route path="super/settings" element={<SuperSettings />} />
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

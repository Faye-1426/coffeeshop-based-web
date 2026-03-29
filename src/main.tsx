import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import App from "./App.tsx";
import { TenantProvider } from "./lib/supabase/TenantContext";
import { queryClient } from "./lib/queryClient";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <TenantProvider>
          <App />
        </TenantProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
);

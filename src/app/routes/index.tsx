import { useRoutes } from "react-router-dom";
import { authRoutes } from "@/modules/auth/routes";
import { dashboardRoutes } from "@/modules/dashboard/routes";
import { productsRoutes } from "@/modules/products/products.routes";
import { inventoryRoutes } from "@/modules/inventory/routes";
import { salesRoutes } from "@/modules/sales";
import { customersRoutes } from "@/modules/customers";
import { returnsRoutes } from "@/modules/returns";
import { invoicesRoutes } from "@/modules/invoices";
import { posRoutes } from "@/modules/pos";
import { movementsRoutes } from "@/modules/movements";
import { reportsRoutes } from "@/modules/reports";
import { settingsRoutes } from "@/modules/settings";
import { ecommerceRoutes } from "@/modules/ecommerce";
import { barcodesRoutes } from "@/modules/barcodes";
import { discountsRoutes } from "@/modules/discounts";
import NotFound from "@/shared/components/NotFound";
import { ProtectedLayout } from "./ProtectedLayout";
import ProtectedRoute from "./ProtectedRoute";
import InvoicePrintPage from "@/modules/invoices/pages/InvoicePrintPage";

const AppRouter = () => {
  return useRoutes([
    ...authRoutes,
    {
      path: "/invoices/print/v/:viewerId",
      element: (
        <ProtectedRoute>
          <InvoicePrintPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/invoices/print/:id",
      element: (
        <ProtectedRoute>
          <InvoicePrintPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/",
      ...ProtectedLayout,
      children: [
        ...dashboardRoutes,
        ...productsRoutes,
        ...inventoryRoutes,
        ...salesRoutes,
        ...customersRoutes,
        ...returnsRoutes,
        ...invoicesRoutes,
        ...posRoutes,
        ...movementsRoutes,
        ...reportsRoutes,
        ...settingsRoutes,
        ...ecommerceRoutes,
        ...barcodesRoutes,
        ...discountsRoutes,
      ],
    },
    { path: "*", element: <NotFound /> },
  ]);
};

export default AppRouter;

import { useRoutes } from "react-router-dom";
import { authRoutes } from "@/modules/auth/routes";
import { dashboardRoutes } from "@/modules/dashboard/routes";
import { productsRoutes } from "@/modules/products/products.routes";
import { inventoryRoutes } from "@/modules/inventory/routes";
import { salesRoutes } from "@/modules/sales";
import { customersRoutes } from "@/modules/customers";
import { returnsRoutes } from "@/modules/returns";
import { shippingRoutes } from "@/modules/shipping";
import { invoicesRoutes } from "@/modules/invoices";
import { posRoutes } from "@/modules/pos";
import { movementsRoutes } from "@/modules/movements";
import { reportsRoutes } from "@/modules/reports";
import { settingsRoutes } from "@/modules/settings";
import NotFound from "@/shared/components/NotFound";
import { ProtectedLayout } from "./ProtectedLayout";

const AppRouter = () => {
  return useRoutes([
    ...authRoutes,
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
        ...shippingRoutes,
        ...invoicesRoutes,
        ...posRoutes,
        ...movementsRoutes,
        ...reportsRoutes,
        ...settingsRoutes,
      ],
    },
    { path: "*", element: <NotFound /> },
  ]);
};

export default AppRouter;

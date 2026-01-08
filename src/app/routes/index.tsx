//NO SE ESTA USANDO, PERO SE PUEDE USAR DE GUÍA - BORRAR
import { useRoutes } from "react-router-dom";
import { authRoutes } from "@/modules/auth/routes";
import { dashboardRoutes } from "@/modules/dashboard/routes";
import { productsRoutes } from "@/modules/products/routes";
import { inventoryRoutes } from "@/modules/inventory/routes";
import { salesRoutes } from "@/modules/sales";
import { customersRoutes } from "@/modules/customers";
import { returnsRoutes } from "@/modules/returns";
import { shippingRoutes } from "@/modules/shipping";
import { invoicesRoutes } from "@/modules/invoices";
import { posRoutes } from "@/modules/pos";
import { movementsRoutes } from "@/modules/movements";
import { expensesRoutes } from "@/modules/expenses";
import { reportsRoutes } from "@/modules/reports";
import { settingsRoutes } from "@/modules/settings";
import NotFound from "@/shared/components/NotFound";
import Login from "@/modules/auth/pages/Login";
import { protectedLayout } from "./ProtectedLayout";

const AppRouter = () => {
  return useRoutes([
    ...authRoutes,
    {
      path: "/",
      ...protectedLayout,
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
        ...expensesRoutes,
        ...reportsRoutes,
        ...settingsRoutes,
      ],
    },

    { path: "/login", element: <Login /> },
    { path: "*", element: <NotFound /> },
  ]);
};

export default AppRouter;

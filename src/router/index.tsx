//BORRAR - NO SE USA
import LoginPage from "@/modules/auth/pages/Login";
import { RouteObject } from "react-router-dom";
import { dashboardRoutes } from "@/modules/dashboard";
import { productRoutes } from "@/modules/products";
import { inventoryRoutes } from "@/modules/inventory";
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
import DashboardLayout from "../layouts/DashboardLayout";
import ProtectedRoute from "@/app/routes/ProtectedRoute";

export const appRoutes: RouteObject[] = [
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      ...dashboardRoutes,
      ...productRoutes,
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
  { path: "*", element: <NotFound /> },
];

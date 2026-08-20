import { createBrowserRouter } from "react-router-dom";
import DashboardLayout from "@/layouts/DashboardLayout";
import Dashboard from "@/modules/dashboard/pages/Dashboard";
import Login from "@/modules/auth/pages/Login";
import NotFound from "@/shared/components/NotFound";
import PublicRoute from "./PublicRoute";
import { ProtectedRoute } from "./ProtectedRoute";
import ProtectedLayout from "./ProtectedLayout";
import { APP_PERMISSIONS_CONFIG, getRoutes } from "@/app/data/permissions";
import { supportRoutes } from "@/modules/support";
import { trainingRoutes } from "@/modules/training";
import ReportsLayout from "@/modules/reports/pages/ReportsLayout";

// Único archivo de rutas. La navegación del sidebar es data aparte
// (`src/app/data/permissions.tsx`); un enlace del sidebar puede apuntar a un
// path que todavía no esté declarado aquí.
const allRoutes = getRoutes(APP_PERMISSIONS_CONFIG).map((route) => ({
  path: route.path,
  element: (
    <ProtectedRoute key={route.path} code={route.code}>
      {route.element}
    </ProtectedRoute>
  ),
}));

// Las páginas de Reportes deben colgar de <ReportsLayout/>, que provee el
// ReportsFiltersContext compartido entre pestañas; montadas planas, los
// filtros usan el contexto por defecto (no-op) y dejan de responder.
const reportRoutes = allRoutes.filter((route) => route.path.startsWith("/reports/"));
const protectedRoutes = allRoutes.filter((route) => !route.path.startsWith("/reports/"));

export const router = createBrowserRouter([
  {
    path: "/login",
    element: (
      <PublicRoute>
        <Login />
      </PublicRoute>
    ),
  },
  {
    element: (
      <ProtectedLayout>
        <DashboardLayout />
      </ProtectedLayout>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      ...protectedRoutes,
      { element: <ReportsLayout />, children: reportRoutes },
      // Soporte queda fuera del sistema de permisos, pero sigue requiriendo sesión.
      ...supportRoutes,
      ...trainingRoutes,
      { path: "*", element: <NotFound /> },
    ],
  },
]);

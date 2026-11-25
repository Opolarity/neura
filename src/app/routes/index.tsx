import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import DashboardLayout from "@/layouts/DashboardLayout";
import Dashboard from "@/modules/dashboard/pages/Dashboard";
import Login from "@/modules/auth/pages/Login";
import OAuthConsent from "@/modules/auth/pages/OAuthConsent";
import NotFound from "@/shared/components/NotFound";
import RouteError from "@/shared/components/RouteError";
import PublicRoute from "./PublicRoute";
import { ProtectedRoute } from "./ProtectedRoute";
import ProtectedLayout from "./ProtectedLayout";
import { APP_PERMISSIONS_CONFIG, getRoutes } from "@/app/data/permissions";
import { supportRoutes } from "@/modules/support";
import { trainingRoutes } from "@/modules/training";
import { profileRoutes } from "@/modules/profile";
import ReportsLayout from "@/modules/reports/pages/ReportsLayout";
import CrmCanvasLayout from "@/modules/crm/layouts/CrmCanvasLayout";
import SplashPage from "@/shared/components/splash/SplashPage";
import AttendanceKioskPage from "@/modules/attendance/pages/AttendanceKioskPage";

// El editor visual del ecommerce va aparte: trae craft.js, CodeMirror y los
// iconos de Font Awesome, que no tienen por qué cargarse con el resto del ERP.
const EditorPage = lazy(() => import("@/modules/ecommerce/editor/pages/EditorPage"));
// El editor de plantillas de impresión también trae craft.js.
const PrintTemplateEditorPage = lazy(
  () => import("@/modules/print-templates/editor/pages/PrintTemplateEditorPage")
);
const PrintTemplateViewPage = lazy(
  () => import("@/modules/print-templates/editor/pages/PrintTemplateViewPage")
);

// Único archivo de rutas. La navegación del sidebar es data aparte
// (`src/app/data/permissions.tsx`); un enlace del sidebar puede apuntar a un
// path que todavía no esté declarado aquí.
const allRoutes = getRoutes(APP_PERMISSIONS_CONFIG).map((route) => ({
  path: route.path,
  canvas: route.canvas,
  element: (
    <ProtectedRoute key={route.path} code={route.code}>
      {route.element}
    </ProtectedRoute>
  ),
}));

const toRoute = ({ path, element }: (typeof allRoutes)[number]) => ({ path, element });

// Las rutas con lienzo propio (los chats del CRM) se montan fuera del
// DashboardLayout, como el editor visual: a pantalla completa y con su barra.
const canvasRoutes = allRoutes.filter((route) => route.canvas).map(toRoute);
const layoutRoutes = allRoutes.filter((route) => !route.canvas);

// Las páginas de Reportes deben colgar de <ReportsLayout/>, que provee el
// ReportsFiltersContext compartido entre pestañas; montadas planas, los
// filtros usan el contexto por defecto (no-op) y dejan de responder.
const reportRoutes = layoutRoutes.filter((route) => route.path.startsWith("/reports/")).map(toRoute);
const protectedRoutes = layoutRoutes.filter((route) => !route.path.startsWith("/reports/")).map(toRoute);

export const router = createBrowserRouter([
  {
    path: "/login",
    element: (
      <PublicRoute>
        <Login />
      </PublicRoute>
    ),
  },
  // Consentimiento OAuth del MCP de ventas (Claude, vía neura-mcp). Fuera de
  // PublicRoute y del layout: resuelve su propia sesión y, sin ella, manda a
  // /login?next=….
  {
    path: "/oauth/consent",
    element: <OAuthConsent />,
  },
  // Kiosco de asistencia de la empresa: sin sesion ni layout. Solo marca en
  // equipos activados (secreto del equipo en este navegador) y donde la
  // ubicacion cae en el radio de un punto de marcacion.
  {
    path: "/asistencia",
    errorElement: <RouteError />,
    element: <AttendanceKioskPage />,
  },
  // Link del kiosco para compartir: activa este equipo sin sesion y deja la
  // URL en /asistencia. Un token viejo o falso muestra el aviso.
  {
    path: "/asistencia/:token",
    errorElement: <RouteError />,
    element: <AttendanceKioskPage />,
  },
  // Editor visual de una página del ecommerce: a pantalla completa, con sesión
  // pero sin el DashboardLayout (el editor trae su propia barra y paneles).
  {
    path: "/ecommerce/editor/:slug",
    errorElement: <RouteError />,
    element: (
      <ProtectedLayout>
        <ProtectedRoute code="ecommerce_editor.edit">
          <Suspense fallback={<SplashPage message="Cargando editor..." />}>
            <EditorPage />
          </Suspense>
        </ProtectedRoute>
      </ProtectedLayout>
    ),
  },
  // Editor de una plantilla de impresión: a pantalla completa, como el del
  // ecommerce. El listado está en Configuración (app/data/permissions.tsx).
  {
    path: "/settings/print-templates/edit/:id",
    errorElement: <RouteError />,
    element: (
      <ProtectedLayout>
        <ProtectedRoute code="print_templates.edit">
          <Suspense fallback={<SplashPage message="Cargando editor..." />}>
            <PrintTemplateEditorPage />
          </Suspense>
        </ProtectedRoute>
      </ProtectedLayout>
    ),
  },
  // Una plantilla del sistema, solo para verla: el editor sin edición. La ve
  // quien ve el listado.
  {
    path: "/settings/print-templates/view/:code",
    errorElement: <RouteError />,
    element: (
      <ProtectedLayout>
        <ProtectedRoute code="print_templates.list">
          <Suspense fallback={<SplashPage message="Cargando plantilla..." />}>
            <PrintTemplateViewPage />
          </Suspense>
        </ProtectedRoute>
      </ProtectedLayout>
    ),
  },
  // Chats del CRM: lienzo propio, sin sidebar ni header del ERP. El sidebar
  // los abre en una pestaña nueva; cada ruta sigue con su ProtectedRoute.
  {
    errorElement: <RouteError />,
    element: (
      <ProtectedLayout>
        <CrmCanvasLayout />
      </ProtectedLayout>
    ),
    children: canvasRoutes,
  },
  {
    errorElement: <RouteError />,
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
      // Mi perfil: también sin permiso, cada usuario edita el suyo.
      ...profileRoutes,
      { path: "*", element: <NotFound /> },
    ],
  },
]);

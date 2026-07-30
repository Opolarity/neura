import { PropsWithChildren, useEffect, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/modules/auth";

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Vistas transversales que NO viven en la tabla `functions` (no son parte del menú
// DB-driven de useFunctions) y por lo tanto nunca aparecen en sp_get_user_views.
// Van accesibles para cualquier usuario autenticado, igual que el botón que las abre.
// Ojo: la comparación es por pathname exacto; si más adelante hay /support/:id,
// hay que pasar a un match por prefijo.
const ALWAYS_ALLOWED_VIEWS = ["/support"];

function isViewAllowed(currentPath: string, allowedViews: string[]): boolean {
  if (currentPath === "/") return true;

  return allowedViews.some(view => {
    if (currentPath === view) return true;
    // Patrón con segmentos :param (ej: /sales/edit/:id)
    if (view.includes("/:")) {
      const pattern =
        "^" +
        view
          .split("/")
          .map(seg => (seg.startsWith(":") ? "[^/]+" : escapeRegExp(seg)))
          .join("/") +
        "$";
      return new RegExp(pattern).test(currentPath);
    }
    // Legacy: view termina en /edit, /view, etc. sin :param
    if (/\/(edit|view|open|ticket|print)$/.test(view)) {
      return new RegExp(`^${escapeRegExp(view)}/[^/]+$`).test(currentPath);
    }
    return false;
  });
}

interface ProtectedRouteProps extends PropsWithChildren {}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, permissions } = useAuth();
  const location = useLocation();
  const toastedPath = useRef<string | null>(null);
  // Una vez que los permisos cargan por primera vez, no volvemos a mostrar
  // el spinner aunque permissionsLoading se active de nuevo (ej: tab switch)
  const permissionsLoadedOnce = useRef(false);
  if (!permissions.permissionsLoading) {
    permissionsLoadedOnce.current = true;
  }

  const isLoading = loading || (permissions.permissionsLoading && !permissionsLoadedOnce.current);

  const allowed =
    !user ||
    ALWAYS_ALLOWED_VIEWS.includes(location.pathname) ||
    permissions.role?.isAdmin ||
    permissions.views.length === 0 ||
    isViewAllowed(location.pathname, permissions.views);

  useEffect(() => {
    if (!isLoading && user && !allowed && toastedPath.current !== location.pathname) {
      toastedPath.current = location.pathname;
      toast.error("No tienes acceso a esta vista");
    }
  }, [isLoading, user, allowed, location.pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowed) {
    return <Navigate to="/" replace />;
  }

  return children;
}

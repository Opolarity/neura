import { PropsWithChildren, useEffect, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/modules/auth";

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isViewAllowed(currentPath: string, allowedViews: string[]): boolean {
  if (currentPath === "/" || currentPath === "/") return true;

  return allowedViews.some(view => {
    if (currentPath === view) return true;
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

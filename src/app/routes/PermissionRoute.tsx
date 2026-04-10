import { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useFunctions } from "@/contexts/FunctionsContext";

// Sufijos de ruta que permiten sub-rutas con un segmento adicional (ej: /edit/123)
const SUBPATH_SUFFIXES = ["/edit", "/view", "/detail", "/create"];

interface PermissionRouteProps extends PropsWithChildren {}

export default function PermissionRoute({ children }: PermissionRouteProps) {
  const { paths, loading } = useFunctions();
  const location = useLocation();

  const normalizePath = (path: string) =>
    path.startsWith("/") ? path : `/${path}`;

  const hasAccessToPath = (path: string) =>
    paths.some((item) => {
      if (!item.location || !item.active) return false;
      const itemPath = normalizePath(item.location);
      if (itemPath === path) return true;
      if (SUBPATH_SUFFIXES.some((suffix) => itemPath.endsWith(suffix) && path.startsWith(itemPath + "/"))) return true;
      return false;
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-600 font-medium">
            Validando permisos...
          </p>
        </div>
      </div>
    );
  }

  const hasAccess = hasAccessToPath(location.pathname);

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  return children;
}

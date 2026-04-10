import { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useFunctions } from "@/contexts/FunctionsContext";

interface PermissionRouteProps extends PropsWithChildren {}

export default function PermissionRoute({ children }: PermissionRouteProps) {
  const { functions, loading } = useFunctions();
  const location = useLocation();

  const normalizePath = (path: string) =>
    path.startsWith("/") ? path : `/${path}`;

  const flattenFunctions = (functions: any[]): any[] => {
    return functions.flatMap((fn) => [
      fn,
      ...(fn.subItems?.flatMap((sub: any) => sub.items) || []),
    ]);
  };

  const hasAccessToPath = (functions: any[], path: string) => {
    const flat = flattenFunctions(functions);

    return flat.some(
      (item) =>
        item.location && item.active && normalizePath(item.location) === path,
    );
  };

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

  const hasAccess = hasAccessToPath(functions, location.pathname);

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  return children;
}

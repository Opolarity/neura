import { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/modules/auth";
import { useFunctionsContext } from "@/modules/auth/context/FunctionsContext";

const DYNAMIC_SUFFIXES = ["edit", "create"];

function isAllowed(pathname: string, normalizedRoutes: string[]): boolean {
  if (normalizedRoutes.includes(pathname)) return true;
  for (const route of normalizedRoutes) {
    const parts = route.split("/");
    const lastSegment = parts[parts.length - 1];
    if (lastSegment && DYNAMIC_SUFFIXES.includes(lastSegment)) {
      const pattern = new RegExp(`^${route}/\\d+$`);
      if (pattern.test(pathname)) return true;
    }
  }
  return false;
}

export default function ProtectedRoute({ children }: PropsWithChildren) {
  const { user, loading: authLoading } = useAuth();
  const { allowedRoutes, loading: functionsLoading } = useFunctionsContext();
  const location = useLocation();

  if (authLoading || functionsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const normalizedRoutes = allowedRoutes
    .filter((r): r is string => r !== null)
    .map(r => (r === "" ? "/" : r.startsWith("/") ? r : `/${r}`));

  if (!isAllowed(location.pathname, normalizedRoutes)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";

import { useAuth } from "@/modules/auth";

type ProtectedRouteProps = {
  code: string;
  children: React.ReactNode;
};

export function ProtectedRoute({
  code,
  children,
}: ProtectedRouteProps) {
  const { permissionCodes, permissionsLoading } = useAuth();

  const hasPermission = permissionCodes.includes(code);

  useEffect(() => {
    if (!permissionsLoading && !hasPermission) {
      toast.error("No tienes acceso");
    }
  }, [permissionsLoading, hasPermission]);

  // Los códigos llegan por RPC: sin esto redirigiría antes de tenerlos.
  if (permissionsLoading) {
    return null;
  }

  if (!hasPermission) {
    return <Navigate to="/" replace />;
  }

  return children;
}

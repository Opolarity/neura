import { Navigate } from "react-router-dom";
import { PropsWithChildren } from "react";
import { useAuth } from "@/modules/auth";

export default function PublicRoute({ children }: PropsWithChildren) {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

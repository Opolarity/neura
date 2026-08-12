import { Navigate } from "react-router-dom";
import { PropsWithChildren } from "react";
import { useAuth } from "@/modules/auth";
import SplashPage from "@/shared/components/splash/SplashPage";

export default function PublicRoute({ children }: PropsWithChildren) {
  const { user, loading } = useAuth();

  if (loading) return <SplashPage />;

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

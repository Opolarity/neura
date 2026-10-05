import { Navigate, useSearchParams } from "react-router-dom";
import { PropsWithChildren } from "react";
import { useAuth } from "@/modules/auth";
import { safeNext } from "@/modules/auth/utils/safeNext";
import SplashPage from "@/shared/components/splash/SplashPage";

export default function PublicRoute({ children }: PropsWithChildren) {
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();

  if (loading) return <SplashPage />;

  // Con sesión ya abierta, se respeta el ?next= (p. ej. volver a
  // /oauth/consent) en vez de ir siempre al dashboard.
  if (user) {
    return <Navigate to={safeNext(searchParams.get("next")) ?? "/"} replace />;
  }

  return children;
}

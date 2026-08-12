import { Navigate } from "react-router-dom";
import { PropsWithChildren } from "react";
import { useAuth } from "@/modules/auth";
import SplashPage from "@/shared/components/splash/SplashPage";

export default function ProtectedLayout({ children }: PropsWithChildren) {
  const { user, loading, permissionsLoading, appUserLoading, companyShortNameLoading } = useAuth();
  const isLoading = permissionsLoading || appUserLoading || companyShortNameLoading;

  // Mientras se resuelve la sesión no se sabe aún si hay que ir al login: se
  // muestra el splash en vez de un frame en blanco.
  if (loading) return <SplashPage />;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // El contenido se monta y carga por debajo; el splash sólo tapa mientras
  // se resuelven los permisos la primera vez (este layout no se remonta al
  // navegar entre páginas internas, así que no vuelve a mostrarse después).
  return (
    <div className="relative min-h-screen">
      {children}
      {isLoading && <SplashPage />}
    </div>
  );
}

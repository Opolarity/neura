import { Navigate } from "react-router-dom";
import { PropsWithChildren } from "react";
import { useAuth } from "@/modules/auth";
import PageLoader from "@/shared/components/page-loader/PageLoader";

export default function ProtectedLayout({ children }: PropsWithChildren) {
  const { user, loading, permissionsLoading, appUserLoading, companyShortNameLoading } = useAuth();
  const isLoading = permissionsLoading || appUserLoading || companyShortNameLoading;

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // El contenido se monta y carga por debajo; el splash sólo tapa mientras
  // se resuelven los permisos la primera vez (este layout no se remonta al
  // navegar entre páginas internas, así que no vuelve a mostrarse después).
  return (
    <div className="relative min-h-screen">
      {children}
      {isLoading && <PageLoader className="bg-white" message="Cargando..." />}
    </div>
  );
}

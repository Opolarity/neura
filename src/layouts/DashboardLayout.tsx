import { Outlet } from "react-router-dom";
import { AppSidebar } from "../components/layout/AppSidebar";
import Header from "../components/layout/Header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { usePOSSessionStatus } from "@/modules/pos/hooks/usePOSSessionStatus";

export default function DashboardLayout() {
  // El hook abre un canal realtime por usuario: se consulta una sola vez aquí
  // y se reparte al header (badge de caja) y al sidebar (aviso antes de salir).
  const posSession = usePOSSessionStatus();

  // El estado abierto/colapsado lo gestiona SidebarProvider; el toggle vive en
  // el header del propio sidebar.
  return (
    <SidebarProvider className="bg-muted h-dvh overflow-hidden">
      <AppSidebar posSessionOpen={posSession.isOpen} />

      <div className="flex-1 min-w-0 flex flex-col">
        <Header posSession={posSession} />

        {/* El scroll vive aquí: las páginas de tabla ocupan el alto disponible
            y solo desplazan sus filas. */}
        <main className="flex-1 min-h-0 overflow-y-auto min-w-0 p-4">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>);
};
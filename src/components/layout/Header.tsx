import React from "react";
import { User, LogOut, Store } from "lucide-react";
import { NotificationPanel } from "@/modules/notifications/components/NotificationPanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useAuth } from "@/modules/auth";
import { useNavigate } from "react-router-dom";
import { usePOSSessionStatus } from "@/modules/pos/hooks/usePOSSessionStatus";
import { POSOpenWarningDialog } from "@/modules/pos/components/POSOpenWarningDialog";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

interface HeaderProps {
  onSignOut: () => void;
}

const Header = ({ onSignOut }: HeaderProps) => {
  const navigate = useNavigate();
  const { isOpen, loading } = usePOSSessionStatus();
  const [showPOSWarning, setShowPOSWarning] = useState(false);
  const { appUser, appUserLoading } = useAuth();
  const isMobile = useIsMobile();

  return (
    <>
    <POSOpenWarningDialog
      open={showPOSWarning}
      onOpenChange={setShowPOSWarning}
      onGoToPOS={() => { setShowPOSWarning(false); navigate("/pos/open"); }}
    />
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* En escritorio el toggle vive en el header del propio sidebar; en
              móvil ese header queda dentro del Sheet cerrado, así que el único
              modo de abrirlo es este disparador. */}
          {isMobile && <SidebarTrigger className="h-9 w-9" />}
        </div>

        <div className="flex items-center gap-4">
          {!loading && (isOpen ? (
            <Button variant="outline" size="sm" className="border-success p-2" onClick={() => navigate("/pos/open")}>
              <Store className="w-5 h-5 text-success" />
              <span className="text-sm text-success">Abierto</span>
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="border-destructive p-2" onClick={() => navigate("/pos/open")}>
              <Store className="w-5 h-5 text-destructive" />
              <span className="text-sm text-destructive">Cerrado</span>
            </Button>
          ))}

          <NotificationPanel />

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="text-sm">
              <p className="font-medium">{appUserLoading ? "Cargando..." : (appUser?.accountName || "Sin Cuenta")}</p>
              <p className="text-gray-500 text-xs">
                {appUserLoading ? "Sin Rol" : (appUser?.roleName || "Sin Rol")}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => isOpen ? setShowPOSWarning(true) : onSignOut()}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Salir
            </Button>
          </div>
        </div>
      </div>
    </header>
    </>
  );
};

export default Header;

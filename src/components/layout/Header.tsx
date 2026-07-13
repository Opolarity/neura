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

interface HeaderProps {
  onSignOut: () => void;
  toggleSidebar?: () => void;
  accountName?: string;
  roleName?: string;
}

const Header = ({ onSignOut }: HeaderProps) => {
  const navigate = useNavigate();
  const { isOpen, loading } = usePOSSessionStatus();
  const [showPOSWarning, setShowPOSWarning] = useState(false);
  const { appUser, appUserLoading } = useAuth();

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
          {/* Espacio para buscador o toggle */}
        </div>

        <div className="flex items-center gap-4">
          {!loading && (isOpen ? (
            <Button variant="outline" size="sm" className="border-green-500 p-2" onClick={() => navigate("/pos/open")}>
              <Store className="w-5 h-5 text-green-500" />
              <span className="text-sm text-green-500">Abierto</span>
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="border-red-500 p-2" onClick={() => navigate("/pos/open")}>
              <Store className="w-5 h-5 text-red-500" />
              <span className="text-sm text-red-500">Cerrado</span>
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

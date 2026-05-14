import React from "react";
import { Bell, User, LogOut, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { getHeaderUserData } from "@/shared/services/service";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { usePOSSessionStatus } from "@/modules/pos/hooks/usePOSSessionStatus";

interface HeaderProps {
  onSignOut: () => void;
  toggleSidebar?: () => void;
  accountName?: string;
  roleName?: string;
}

const Header = ({ onSignOut }: HeaderProps) => {
  const navigate = useNavigate();
  const { isOpen, loading } = usePOSSessionStatus();
  const [userData, setUserData] = useState({
    account: "Cargando...",
    role: "Sin Rol",
  });
  useEffect(() => {
    const initHeader = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const profile = await getHeaderUserData(user.id);

        if (profile) {
          setUserData({
            account: profile.accountName,
            role: profile.roleName,
          });
        }
      }
    };

    initHeader();
  }, []);

  return (
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

          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="text-sm">
              <p className="font-medium">{userData.account || "Cargando..."}</p>
              <p className="text-gray-500 text-xs">
                {userData.role || "Sin Rol"}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onSignOut}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Salir
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

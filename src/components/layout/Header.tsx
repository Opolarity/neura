import React from 'react';
import { Bell, User, LogOut, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { getHeaderUserData } from '@/shared/services/service';
import { supabase } from '@/integrations/supabase/client';
import { useEcommerceSso } from '@/modules/ecommerce/hooks/useEcommerceSso';

interface HeaderProps {
  onSignOut: () => void;
  toggleSidebar?: () => void;
  accountName?: string;
  roleName?: string;
}

const Header = ({ onSignOut }: HeaderProps) => {
  const [userData, setUserData] = useState({ account: 'Cargando...', role: 'Sin Rol' });
  const { redirectToEcommerce, loading: ssoLoading } = useEcommerceSso();

  useEffect(() => {
    const initHeader = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const profile = await getHeaderUserData(user.id);

        if (profile) {
          setUserData({
            account: profile.accountName,
            role: profile.roleName
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
          <Button
            variant="outline"
            size="sm"
            onClick={redirectToEcommerce}
            disabled={ssoLoading}
            className="gap-2"
          >
            {ssoLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ExternalLink className="w-4 h-4" />
            )}
            Editar Ecommerce
          </Button>

          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="text-sm">
              <p className="font-medium">{userData.account || 'Cargando...'}</p>
              <p className="text-gray-500 text-xs">
                {userData.role || 'Sin Rol'}
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

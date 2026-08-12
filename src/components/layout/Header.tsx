import { Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { NotificationPanel } from "@/modules/notifications/components/NotificationPanel";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/modules/auth/hooks/useAuth";

interface HeaderProps {
  posSession: { isOpen: boolean; loading: boolean };
}

const Header = ({ posSession }: HeaderProps) => {
  const navigate = useNavigate();
  const { isOpen, loading } = posSession;
  const isMobile = useIsMobile();
  const { appUser } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-border px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* En escritorio el toggle vive en el header del propio sidebar; en
              móvil ese header queda dentro del Sheet cerrado, así que el único
              modo de abrirlo es este disparador. */}
          {isMobile && <SidebarTrigger className="h-9 w-9" />}
        </div>

        <div className="flex items-center gap-2">
          {appUser?.branchName && (
            <span className="text-sm font-medium text-muted-foreground">
              {appUser.branchName}
            </span>
          )}

          {!loading && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/pos/open")}
              className={`gap-1.5 text-xs font-medium ${
                isOpen
                  ? "border-success bg-success/10 text-success hover:bg-success/20 hover:text-success"
                  : "border-destructive bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive"
              }`}
            >
              <Store className="w-4 h-4" />
              {isOpen ? "Caja abierta" : "Caja cerrada"}
            </Button>
          )}

          <NotificationPanel />
        </div>
      </div>
    </header>
  );
};

export default Header;

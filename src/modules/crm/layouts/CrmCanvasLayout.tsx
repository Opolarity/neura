import { useEffect, useMemo } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { APP_PERMISSIONS_CONFIG, getCanvasRoutes } from "@/app/data/permissions";
import { useAuth } from "@/modules/auth";
import { RumBoundary } from "@/shared/components/RumBoundary";
import { cn } from "@/shared/utils/utils";

const CANVAS_ROUTES = getCanvasRoutes(APP_PERMISSIONS_CONFIG);

/**
 * Lienzo propio de los chats del CRM, como el del editor visual del ecommerce:
 * pantalla completa, sin el sidebar ni el header del ERP. El sidebar lo abre en
 * una pestaña nueva, así que el ERP sigue en la suya.
 *
 * El área de contenido mantiene el contrato del DashboardLayout (flex-1,
 * min-h-0, overflow-y-auto, p-4, relative): las páginas usan `h-full min-h-0`
 * y no cambian.
 */
export default function CrmCanvasLayout() {
  const { pathname } = useLocation();
  const { permissionCodes, appUser, appUserLoading } = useAuth();

  // Solo las pestañas que el usuario puede abrir.
  const tabs = useMemo(
    () => CANVAS_ROUTES.filter((route) => permissionCodes.includes(route.code)),
    [permissionCodes]
  );

  // El título distingue esta pestaña de la del ERP.
  useEffect(() => {
    const previous = document.title;
    document.title = "Chats · NEURA";
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-muted">
      <header className="flex min-h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-background px-4 py-2">
        <div className="flex min-w-0 items-center gap-4">
          {/* Mismo cuadrado que la barra del editor visual: lleva al ERP. */}
          <Link
            to="/"
            title="Ir al ERP"
            aria-label="Ir al ERP"
            className="flex aspect-square size-8 shrink-0 select-none items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
          >
            N
          </Link>

          <nav className="flex items-center gap-1" aria-label="Chats">
            {tabs.map((tab) => {
              const active = tab.path === pathname;
              return (
                <Link
                  key={tab.code}
                  to={tab.path}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "select-none rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                    active && "bg-muted font-semibold text-foreground"
                  )}
                >
                  {tab.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="hidden min-w-0 text-right leading-tight sm:grid">
          <span className="truncate text-sm font-medium text-foreground">
            {appUserLoading ? "Cargando..." : (appUser?.accountName || "Sin Cuenta")}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {appUserLoading ? "" : (appUser?.roleName || "Sin Rol")}
          </span>
        </div>
      </header>

      <main className="relative min-h-0 min-w-0 flex-1 overflow-y-auto p-4">
        <RumBoundary>
          <Outlet />
        </RumBoundary>
      </main>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { BookOpen, ChevronDown, EllipsisVertical, GraduationCap, LayoutDashboard, LifeBuoy, LogOut, Store, Ticket, User } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { APP_PERMISSIONS_CONFIG, getFilterSidebar } from "@/app/data/permissions";
import { useAuth } from "@/modules/auth";
import { POSOpenWarningDialog } from "@/modules/pos/components/POSOpenWarningDialog";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type SidebarModuleItem = ReturnType<typeof getFilterSidebar>[number];

// El fondo, el texto inactivo y el hover salen de los tokens --sidebar-* (src/index.css).
// Aquí solo van los estados que el token no puede expresar y los portales
// (popover/tooltip), que al montarse fuera del sidebar no heredan sus colores.
const MENU_BUTTON_COLORS = [
  "data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground",
  "data-[state=open]:data-[active=false]:bg-white/5 data-[state=open]:data-[active=false]:text-white",
  // El estado del ícono se escribe como variante arbitraria completa: encadenar
  // `hover:` o `data-[...]:` con `[&>svg]` deja la condición sobre el <svg> y no
  // sobre el botón, así que el selector nunca coincide.
  "[&>svg]:transition-colors",
  "[&:hover:not([data-active=true])>svg]:text-sidebar-ring",
  "[&[data-state=open][data-active=false]>svg]:text-sidebar-ring",
  "[&[data-active=true]>svg]:text-sidebar-primary-foreground",
].join(" ");

const SUB_BUTTON_COLORS =
  "data-[active=true]:bg-sidebar-ring/5 data-[active=true]:text-sidebar-ring data-[active=true]:font-semibold";

const SUB_LABEL_COLORS = "text-sidebar-foreground/70";

const TOOLTIP_COLORS = "border-0 bg-sidebar-primary text-sidebar-primary-foreground";

const USER_POPOVER_CODE = "__user__";

// Las opciones de Soporte. Viven aquí y no en APP_PERMISSIONS_CONFIG a
// propósito: Soporte está fuera del sistema de permisos (ver routes/index.tsx),
// así que meterlas ahí les exigiría códigos que hoy nadie tiene asignados.
const SUPPORT_LINKS = [
  { to: "/support", label: "Tickets", icon: Ticket },
  { to: "/support/capacitaciones", label: "Capacitaciones", icon: GraduationCap },
] as const;

function SidebarModule({
  item,
  pathname,
  openPopoverCode,
  onPopoverOpenChange,
}: {
  item: SidebarModuleItem;
  pathname: string;
  openPopoverCode: string | null;
  onPopoverOpenChange: (code: string | null) => void;
}) {
  const isModuleActive = item.node.some(
    (subItem) => "path" in subItem && subItem.path === pathname
  );
  const [open, setOpen] = useState(isModuleActive);
  const { state, isMobile } = useSidebar();
  const isCollapsed = state === "collapsed" && !isMobile;
  const isPopoverOpen = openPopoverCode === item.code;
  const isAnyPopoverOpen = openPopoverCode !== null;
  const [tooltipOpen, setTooltipOpen] = useState(false);

  // Auto-expand when navigation lands on a route inside this module.
  useEffect(() => {
    if (isModuleActive) setOpen(true);
  }, [isModuleActive]);

  // ============================================
  // COLAPSADO: el submenú vive en un popover
  // ============================================

  if (isCollapsed) {
    return (
      <SidebarMenuItem>
        <Popover
          open={isPopoverOpen}
          onOpenChange={(nextOpen) => onPopoverOpenChange(nextOpen ? item.code : null)}
        >
          <Tooltip
            open={tooltipOpen && !isPopoverOpen && !isAnyPopoverOpen}
            onOpenChange={setTooltipOpen}
          >
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <SidebarMenuButton
                  isActive={isModuleActive}
                  onClick={() => setTooltipOpen(false)}
                  className={MENU_BUTTON_COLORS}
                >
                  <item.icon />
                  <span>{item.name}</span>
                </SidebarMenuButton>
              </PopoverTrigger>
            </TooltipTrigger>

            <TooltipContent side="right" align="center" className={TOOLTIP_COLORS}>
              {item.name}
            </TooltipContent>
          </Tooltip>

          <PopoverContent
            side="right"
            align="start"
            sideOffset={18}
            className="max-h-[80vh] w-56 overflow-y-auto border-white/10 bg-sidebar p-1 text-white shadow-2xl shadow-black/50 sidebar-scroll"
          >
            {item.node.map((subItem) => {
              if ("path" in subItem) {
                return (
                  <Link
                    key={subItem.code}
                    to={subItem.path}
                    onClick={() => onPopoverOpenChange(null)}
                    data-active={subItem.path === pathname}
                    className={`flex w-full items-center rounded-md px-2 py-1.5 text-sm text-sidebar-foreground transition-colors hover:bg-white/5 hover:text-white ${SUB_BUTTON_COLORS}`}
                  >
                    {subItem.name}
                  </Link>
                );
              }

              return (
                <span
                  key={subItem.code}
                  className={`block px-2 py-1 text-xs font-medium ${SUB_LABEL_COLORS}`}
                >
                  {subItem.name}
                </span>
              );
            })}
          </PopoverContent>
        </Popover>
      </SidebarMenuItem>
    );
  }

  // ============================================
  // EXPANDIDO: el submenú se despliega en línea
  // ============================================

  return (
    <Collapsible
      className="group/collapsible"
      open={open}
      onOpenChange={setOpen}
    >
      <SidebarMenuItem>

        <CollapsibleTrigger asChild>
          <SidebarMenuButton isActive={isModuleActive} className={MENU_BUTTON_COLORS}>
            <item.icon />

            <span>{item.name}</span>

            <ChevronDown className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
          </SidebarMenuButton>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <SidebarMenuSub>

            {item.node.map((subItem) => {
              // ============================================
              // ENLACE
              // ============================================

              if ("path" in subItem) {
                return (
                  <SidebarMenuSubItem key={subItem.code}>
                    <SidebarMenuSubButton
                      asChild
                      isActive={subItem.path === pathname}
                      className={SUB_BUTTON_COLORS}
                    >
                      <Link to={subItem.path}>
                        <span className="text-sm">{subItem.name}</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                );
              }

              // ============================================
              // TEXTO (agrupamiento visual)
              // ============================================

              return (
                <SidebarMenuSubItem key={subItem.code}>
                  <span className={`px-2 text-[10px] uppercase font-bold ${SUB_LABEL_COLORS}`}>
                    {subItem.name}
                  </span>
                </SidebarMenuSubItem>
              );
            })}

          </SidebarMenuSub>
        </CollapsibleContent>

      </SidebarMenuItem>
    </Collapsible>
  );
}

export function AppSidebar({ posSessionOpen = false }: { posSessionOpen?: boolean }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const {
    permissionCodes,
    permissionsLoading,
    companyShortName,
    companyShortNameLoading,
    appUser,
    appUserLoading,
    signOut,
  } = useAuth();
  const { state, isMobile, toggleSidebar } = useSidebar();
  const [openPopoverCode, setOpenPopoverCode] = useState<string | null>(null);
  const [showPOSWarning, setShowPOSWarning] = useState(false);
  const isAnyPopoverOpen = openPopoverCode !== null;
  const isUserPopoverOpen = openPopoverCode === USER_POPOVER_CODE;

  // Los códigos llegan por RPC: hasta entonces solo se muestra el Dashboard.
  const menuItems = useMemo(
    () => (permissionsLoading ? [] : getFilterSidebar(APP_PERMISSIONS_CONFIG, permissionCodes)),
    [permissionsLoading, permissionCodes]
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-white/10">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2 py-1.5">
            <button
              type="button"
              onClick={toggleSidebar}
              className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
            >
              <Store className="size-4" />
            </button>

            <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate font-semibold text-white">
                {companyShortNameLoading ? "ERP" : (companyShortName.toUpperCase() || "ERP")}
              </span>
              <span className="truncate text-xs text-sidebar-foreground">
                ERP System
              </span>
            </div>

            <SidebarTrigger className="text-sidebar-foreground hover:bg-white/5 hover:text-white group-data-[collapsible=icon]:hidden" />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* `sidebar-scroll` (index.css) reproduce el scrollbar fino del sidebar
          anterior; el primitivo solo trae `overflow-auto` y deja el nativo. */}
      <SidebarContent className="sidebar-scroll overflow-x-hidden">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/"}
                  className={MENU_BUTTON_COLORS}
                  tooltip={{
                    children: "Dashboard",
                    hidden: state !== "collapsed" || isMobile || isAnyPopoverOpen,
                    className: TOOLTIP_COLORS,
                  }}
                >
                  <Link to="/">
                    <LayoutDashboard />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {menuItems.map((item) => (
                <SidebarModule
                  key={item.code}
                  item={item}
                  pathname={pathname}
                  openPopoverCode={openPopoverCode}
                  onPopoverOpenChange={setOpenPopoverCode}
                />
              ))}

            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-white/10">
        <SidebarMenu>
          <SidebarMenuItem>
            <Popover
              open={isUserPopoverOpen}
              onOpenChange={(nextOpen) => setOpenPopoverCode(nextOpen ? USER_POPOVER_CODE : null)}
            >
              <PopoverTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  isActive={isUserPopoverOpen}
                  className={`h-auto py-1.5 group-data-[collapsible=icon]:px-0 ${MENU_BUTTON_COLORS}`}
                >
                  <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                    <User className="size-4" />
                  </div>

                  <div className="grid flex-1 text-left leading-tight">
                    <span className="truncate text-sm font-medium text-white">
                      {appUserLoading ? "Cargando..." : (appUser?.accountName || "Sin Cuenta")}
                    </span>
                    <span className="truncate text-xs text-sidebar-foreground">
                      {appUserLoading ? "Sin Rol" : (appUser?.roleName || "Sin Rol")}
                    </span>
                  </div>

                  <EllipsisVertical className="ml-auto size-4 shrink-0 text-sidebar-foreground/70" />
                </SidebarMenuButton>
              </PopoverTrigger>

              <PopoverContent
                side="right"
                align="end"
                sideOffset={16}
                collisionPadding={4}
                className="w-56 border-white/10 bg-sidebar p-1 text-white shadow-none"
              >
                <div className="flex items-center gap-2 px-2 py-1.5">
                  <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                    <User className="size-4" />
                  </div>

                  <div className="grid flex-1 text-left leading-tight">
                    <span className="truncate text-sm font-medium text-white">
                      {appUserLoading ? "Cargando..." : (appUser?.accountName || "Sin Cuenta")}
                    </span>
                    <span className="truncate text-xs text-sidebar-foreground">
                      {appUserLoading ? "Sin Rol" : (appUser?.roleName || "Sin Rol")}
                    </span>
                  </div>
                </div>

                <div className="my-1 h-px bg-white/10" />

                {/* Soporte dejó de ser una pantalla y pasó a ser un grupo. El
                    título usa el mismo estilo que las etiquetas de grupo del
                    submenú del sidebar, para que no parezca un enlace muerto. */}
                <div className={`flex items-center gap-2 px-2 py-1 text-xs font-medium ${SUB_LABEL_COLORS}`}>
                  <LifeBuoy className="size-3.5" />
                  <span>Soporte</span>
                </div>

                {SUPPORT_LINKS.map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setOpenPopoverCode(null)}
                    data-active={pathname === to}
                    className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 pl-4 text-sm text-sidebar-foreground transition-colors hover:bg-white/5 hover:text-white ${SUB_BUTTON_COLORS}`}
                  >
                    <Icon className="size-4" />
                    <span>{label}</span>
                  </Link>
                ))}

                {/* Aprender todavía no tiene contenido. Se muestra igualmente
                    para que se sepa que viene, pero no navega a ninguna parte:
                    un enlace a una pantalla vacía se lee como algo roto. */}
                <div
                  aria-disabled="true"
                  className="flex w-full cursor-not-allowed items-center gap-2 rounded-md px-2 py-1.5 pl-4 text-sm text-sidebar-foreground/50"
                >
                  <BookOpen className="size-4" />
                  <span>Aprender</span>
                  <span className="ml-auto text-[10px] uppercase tracking-wide">Pronto</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setOpenPopoverCode(null);
                    posSessionOpen ? setShowPOSWarning(true) : signOut();
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground transition-colors hover:bg-white/5 hover:text-white"
                >
                  <LogOut className="size-4" />
                  <span>Cerrar sesión</span>
                </button>
              </PopoverContent>
            </Popover>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <POSOpenWarningDialog
        open={showPOSWarning}
        onOpenChange={setShowPOSWarning}
        onGoToPOS={() => { setShowPOSWarning(false); navigate("/pos/open"); }}
      />
    </Sidebar>
  );
}

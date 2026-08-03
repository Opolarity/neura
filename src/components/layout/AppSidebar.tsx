import { useEffect, useMemo, useState } from "react";
import { ChevronDown, LayoutDashboard, LifeBuoy, Store } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { APP_PERMISSIONS_CONFIG, getFilterSidebar } from "@/app/data/permissions";
import { useAuth } from "@/modules/auth";

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
  "data-[active=true]:bg-blue-600 data-[active=true]:text-white",
  "data-[active=true]:shadow-lg data-[active=true]:shadow-blue-600/20",
  "data-[state=open]:data-[active=false]:bg-white/5 data-[state=open]:data-[active=false]:text-white",
  // El estado del ícono se escribe como variante arbitraria completa: encadenar
  // `hover:` o `data-[...]:` con `[&>svg]` deja la condición sobre el <svg> y no
  // sobre el botón, así que el selector nunca coincide.
  "[&>svg]:transition-colors",
  "[&:hover:not([data-active=true])>svg]:text-blue-400",
  "[&[data-state=open][data-active=false]>svg]:text-blue-400",
  "[&[data-active=true]>svg]:text-white",
].join(" ");

const SUB_BUTTON_COLORS =
  "data-[active=true]:bg-blue-400/5 data-[active=true]:text-blue-400 data-[active=true]:font-semibold";

const SUB_LABEL_COLORS = "text-slate-500";

const TOOLTIP_COLORS = "border-0 bg-blue-600 text-white";

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
            className="w-56 border-white/10 bg-[#0f172a] p-1 text-white shadow-2xl shadow-black/50"
          >
            {item.node.map((subItem) => {
              if ("path" in subItem) {
                return (
                  <Link
                    key={subItem.code}
                    to={subItem.path}
                    onClick={() => onPopoverOpenChange(null)}
                    data-active={subItem.path === pathname}
                    className={`flex w-full items-center rounded-md px-2 py-1.5 text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-white ${SUB_BUTTON_COLORS}`}
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
                        <span>{subItem.name}</span>
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
                  <span className={`px-2 text-xs font-medium ${SUB_LABEL_COLORS}`}>
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

export function AppSidebar() {
  const { pathname } = useLocation();
  const { permissionCodes, permissionsLoading, companyShortName, companyShortNameLoading } = useAuth();
  const { state, isMobile, toggleSidebar } = useSidebar();
  const [openPopoverCode, setOpenPopoverCode] = useState<string | null>(null);
  const isAnyPopoverOpen = openPopoverCode !== null;

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
              className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-lg shadow-blue-900/20"
            >
              <Store className="size-4" />
            </button>

            <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate font-semibold text-white">
                {companyShortNameLoading ? "ERP" : (companyShortName.toUpperCase() || "ERP")}
              </span>
              <span className="truncate text-xs text-slate-400">
                ERP System
              </span>
            </div>

            <SidebarTrigger className="text-slate-400 hover:bg-white/5 hover:text-white group-data-[collapsible=icon]:hidden" />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
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
            <SidebarMenuButton
              asChild
              isActive={pathname === "/support"}
              className={MENU_BUTTON_COLORS}
              tooltip={{
                children: "Soporte",
                hidden: state !== "collapsed" || isMobile || isAnyPopoverOpen,
                className: TOOLTIP_COLORS,
              }}
            >
              <Link to="/support">
                <LifeBuoy />
                <span>Soporte</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

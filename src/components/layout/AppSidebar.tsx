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
                >
                  <item.icon />
                  <span>{item.name}</span>
                </SidebarMenuButton>
              </PopoverTrigger>
            </TooltipTrigger>

            <TooltipContent side="right" align="center">
              {item.name}
            </TooltipContent>
          </Tooltip>

          <PopoverContent side="right" align="start" sideOffset={18} className="w-56 p-1">
            {item.node.map((subItem) => {
              if ("path" in subItem) {
                return (
                  <Link
                    key={subItem.code}
                    to={subItem.path}
                    onClick={() => onPopoverOpenChange(null)}
                    data-active={subItem.path === pathname}
                    className="flex w-full items-center rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground data-[active=true]:bg-accent data-[active=true]:text-accent-foreground"
                  >
                    {subItem.name}
                  </Link>
                );
              }

              return (
                <span
                  key={subItem.code}
                  className="block px-2 py-1 text-xs font-medium text-muted-foreground"
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
          <SidebarMenuButton isActive={isModuleActive}>
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
                  <span className="px-2 text-xs font-medium text-muted-foreground">
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
      <SidebarHeader className="border-b">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2 py-1.5">
            <button
              type="button"
              onClick={toggleSidebar}
              className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"
            >
              <Store className="size-4" />
            </button>

            <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate font-semibold">
                {companyShortNameLoading ? "ERP" : (companyShortName.toUpperCase() || "ERP")}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                ERP System
              </span>
            </div>

            <SidebarTrigger className="group-data-[collapsible=icon]:hidden" />
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
                  tooltip={{
                    children: "Dashboard",
                    hidden: state !== "collapsed" || isMobile || isAnyPopoverOpen,
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

      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/support"}
              tooltip={{
                children: "Soporte",
                hidden: state !== "collapsed" || isMobile || isAnyPopoverOpen,
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

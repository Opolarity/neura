import { useState } from "react";
import { ChevronRight, Plug } from "lucide-react";
import { SidebarMenuButton, useSidebar } from "@/components/ui/sidebar";
import { useAiConnections } from "../hooks/useAiConnections";
import { AI_APP_GUIDES } from "../constants/aiConnect.constants";
import { AiConnectDialog } from "./AiConnectDialog";

interface Props {
  /** Clases de color del sidebar (MENU_BUTTON_COLORS), para no duplicarlas aqui. */
  buttonClassName?: string;
  tooltipClassName?: string;
}

/**
 * Acceso fijo al pie del sidebar, encima del usuario. Reemplaza a la pantalla
 * Asistente IA: ya no se chatea dentro del ERP, se conecta el MCP en Claude o
 * ChatGPT y se pregunta alli.
 */
export function AiConnectCard({ buttonClassName = "", tooltipClassName }: Props) {
  const [open, setOpen] = useState(false);
  const { connections, error, revoke } = useAiConnections();
  const { state, isMobile } = useSidebar();

  const connectedLabels = [...new Set(connections.map((c) => (c.app === "other" ? c.name : AI_APP_GUIDES[c.app].label)))];
  const connected = connectedLabels.length > 0;
  const title = connected ? "IA conectada" : "Conecta tu IA";

  return (
    <>
      <SidebarMenuButton
        size="lg"
        isActive={open}
        onClick={() => setOpen(true)}
        tooltip={{
          children: title,
          hidden: state !== "collapsed" || isMobile,
          className: tooltipClassName,
        }}
        className={`h-auto border border-sidebar-border py-1.5 group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:px-0 ${buttonClassName}`}
      >
        <div
          className={`relative flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg text-white ${connected ? "bg-sidebar-accent" : "bg-sidebar-primary"}`}
        >
          <Plug className="size-4" />
          {connected && (
            // El punto es estado, no adorno: por eso lleva color.
            <span
              className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-sidebar bg-success"
              aria-label="IA conectada"
            />
          )}
        </div>

        <div className="grid flex-1 text-left leading-tight">
          <span className="truncate text-sm font-semibold text-white">{title}</span>
          <span className="truncate text-xs text-sidebar-foreground">
            {connected ? connectedLabels.join(" · ") : "Claude · ChatGPT"}
          </span>
        </div>

        <ChevronRight className="ml-auto size-4 shrink-0 text-sidebar-foreground/70" />
      </SidebarMenuButton>

      <AiConnectDialog
        open={open}
        onOpenChange={setOpen}
        connections={connections}
        statusAvailable={!error}
        onRevoke={revoke}
      />
    </>
  );
}

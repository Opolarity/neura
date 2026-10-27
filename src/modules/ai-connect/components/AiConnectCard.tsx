import { useState } from "react";
import { ChevronRight, Sparkles } from "lucide-react";
import { SidebarMenuButton, useSidebar } from "@/components/ui/sidebar";
import { useAiConnections } from "../hooks/useAiConnections";
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

  const connected = connections.length > 0;
  const title = connected ? "IA conectada" : "Conecta tu IA";

  return (
    <>
      <SidebarMenuButton
        isActive={open}
        onClick={() => setOpen(true)}
        tooltip={{
          children: title,
          hidden: state !== "collapsed" || isMobile,
          className: tooltipClassName,
        }}
        className={`border border-sidebar-border group-data-[collapsible=icon]:border-0 ${buttonClassName}`}
      >
        <span className="relative flex shrink-0 text-white">
          <Sparkles className="size-4" />
          {connected && (
            // El punto es estado, no adorno: por eso lleva color.
            <span
              className="absolute -right-1 -top-1 size-2 rounded-full border border-sidebar bg-success"
              aria-label="IA conectada"
            />
          )}
        </span>

        <span className="flex-1 truncate font-semibold text-white">{title}</span>

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

import { useState } from "react";
import type { NodeId } from "@craftjs/core";
import {
  ClipboardPaste,
  Copy,
  CopyPlus,
  Trash,
  type LucideIcon,
} from "lucide-react";
import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from "@/components/ui/context-menu";
import { cn } from "@/shared/utils/utils";
import { useNodeActions } from "../lib/node-actions-context";

function NodeMenuItem({
  icon: Icon,
  label,
  shortcut,
  disabled,
  destructive,
  onSelect,
}: {
  icon: LucideIcon;
  label: string;
  shortcut: string;
  disabled: boolean;
  destructive?: boolean;
  onSelect: () => void;
}) {
  return (
    <ContextMenuItem
      disabled={disabled}
      onSelect={onSelect}
      className={cn(
        "gap-2 text-[12px]",
        destructive && "text-destructive focus:text-destructive",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
      <ContextMenuShortcut className="pl-4 tracking-normal">
        {shortcut}
      </ContextMenuShortcut>
    </ContextMenuItem>
  );
}

/**
 * El menú del clic derecho en un nodo, en la Estructura y en el lienzo. Va
 * dentro de un <ContextMenu>. Se arma al abrirse, con lo que se puede hacer en
 * ese momento; las mismas acciones tienen atajo de teclado.
 *
 * Sale a la derecha del clic y centrado en su altura. Radix lo alinea por
 * arriba sin dejar cambiarlo: se sube media altura, medida al abrirse, y él
 * sigue corrigiendo si no cabe en la pantalla.
 */
/**
 * Media altura del menú, la última medida: es siempre el mismo menú, y cada
 * apertura lo monta de nuevo (ver `key` en quien lo usa).
 */
let lastHalfHeight = 0;

export function NodeMenuContent({ id }: { id: NodeId }) {
  const nodeActions = useNodeActions();
  const can = nodeActions.availability(id);
  const [halfHeight, setHalfHeight] = useState(lastHalfHeight);

  return (
    <ContextMenuContent
      ref={(element) => {
        const half = element ? Math.round(element.offsetHeight / 2) : 0;
        if (!half || half === halfHeight) return;
        lastHalfHeight = half;
        setHalfHeight(half);
      }}
      alignOffset={-halfHeight}
      className="w-52"
    >
      <NodeMenuItem
        icon={Copy}
        label="Copiar"
        shortcut="Ctrl+C"
        disabled={!can.copy}
        onSelect={() => nodeActions.copy(id)}
      />
      <NodeMenuItem
        icon={ClipboardPaste}
        label="Pegar"
        shortcut="Ctrl+V"
        disabled={!can.paste}
        onSelect={() => nodeActions.paste(id)}
      />
      <NodeMenuItem
        icon={CopyPlus}
        label="Duplicar"
        shortcut="Ctrl+D"
        disabled={!can.duplicate}
        onSelect={() => nodeActions.duplicate(id)}
      />
      <ContextMenuSeparator />
      <NodeMenuItem
        icon={Trash}
        label="Eliminar"
        shortcut="Supr"
        disabled={!can.remove}
        destructive
        onSelect={() => nodeActions.remove(id)}
      />
    </ContextMenuContent>
  );
}

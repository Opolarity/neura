import { useEffect, useState } from "react";
import { Check, UserRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/modules/auth";
import { cn } from "@/shared/utils/utils";
import { getErpUsersApi, type ErpUser } from "../services/crm.service";

interface Props {
  assignedTo: string | null;
  /** Nombre del asesor asignado: la opción lo muestra junto a "Asignar". */
  assignedToName: string | null;
  disabled?: boolean;
  onAssign: (userId: string | null) => void;
}

/**
 * Submenú "Asignar" del menú ⋯ del chat.
 *
 * Único punto para asignar una conversación: desde acá se elige a uno mismo o
 * a otra persona. Antes había además un botón "Asignármela", y tener dos
 * caminos para lo mismo obligaba a mirar los dos para saber quién la tiene.
 *
 * Quien no puede repartir el trabajo del equipo (sin crm_conversations.assign_any)
 * ve el menú igual, pero solo con la opción de tomarla para sí. Así el permiso
 * de supervisión sigue significando algo sin dejar al asesor sin forma de
 * hacerse cargo de un chat.
 *
 * La lista de usuarios se carga la PRIMERA vez que se abre el submenú y no al
 * montar la pantalla: son hasta 100 usuarios que la mayoría de las veces no se
 * van a mirar.
 */
export const AssignSubmenu = ({ assignedTo, assignedToName, disabled, onAssign }: Props) => {
  const { user, permissionCodes, isAdmin } = useAuth();
  const canAssignOthers =
    isAdmin || permissionCodes.includes("crm_conversations.assign_any");

  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<ErpUser[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    if (!open || !canAssignOthers || users !== null || loading) return;

    setLoading(true);
    getErpUsersApi()
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [open, canAssignOthers, users, loading]);

  const assignedToMe = !!user?.id && assignedTo === user.id;

  // Uno mismo no aparece dos veces: va fijo arriba y se saca de la lista.
  const visible = (users ?? [])
    .filter((u) => u.id !== user?.id)
    .filter((u) => u.name.toLowerCase().includes(filter.trim().toLowerCase()));

  const current = assignedTo
    ? assignedToMe
      ? "Tú"
      : (assignedToName || "Asignado").split(/\s+/)[0]
    : "Nadie";

  return (
    <DropdownMenuSub open={open} onOpenChange={setOpen}>
      <DropdownMenuSubTrigger className="items-start gap-2 text-xs [&>svg:last-child]:h-3.5 [&>svg:last-child]:w-3.5" disabled={disabled}>
        <UserRound className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            <span className="font-medium">Asignar</span>
            <span className="ml-auto max-w-[90px] truncate text-muted-foreground">{current}</span>
          </span>
          <span className="block text-[11px] text-muted-foreground">El asesor que se encarga del cliente.</span>
        </span>
      </DropdownMenuSubTrigger>

      <DropdownMenuSubContent className="w-64 p-0">
        <div className="p-1">
          <DropdownMenuItem
            onSelect={() => onAssign(user?.id ?? null)}
            disabled={assignedToMe}
            className="flex items-center gap-2"
          >
            <Check className={cn("h-4 w-4 shrink-0", assignedToMe ? "opacity-100" : "opacity-0")} />
            <span className="text-sm font-medium">Asignármela a mí</span>
          </DropdownMenuItem>
        </div>

        {canAssignOthers && (
          <>
            <DropdownMenuSeparator className="my-0" />

            <div className="p-2">
              <Input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                // El menú busca por la letra tecleada y movería el foco a una
                // opción: lo que se escribe es para el buscador.
                onKeyDown={(e) => e.key !== "Escape" && e.stopPropagation()}
                placeholder="Buscar asesor…"
                className="h-8 text-xs"
              />
            </div>

            <ScrollArea className="max-h-56">
              <div className="p-1">
                {loading && (
                  <p className="px-2 py-3 text-center text-xs text-muted-foreground">
                    Cargando…
                  </p>
                )}

                {!loading && visible.length === 0 && (
                  <p className="px-2 py-3 text-center text-xs text-muted-foreground">
                    Sin resultados
                  </p>
                )}

                {!loading &&
                  visible.map((u) => (
                    <DropdownMenuItem
                      key={u.id}
                      onSelect={() => onAssign(u.id)}
                      className="flex items-start gap-2"
                    >
                      <Check
                        className={cn(
                          "mt-0.5 h-4 w-4 shrink-0",
                          u.id === assignedTo ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm">{u.name}</span>
                        {u.role && (
                          <span className="block truncate text-xs text-muted-foreground">
                            {u.role}
                          </span>
                        )}
                      </span>
                    </DropdownMenuItem>
                  ))}
              </div>
            </ScrollArea>
          </>
        )}

        {assignedTo && (
          <>
            <DropdownMenuSeparator className="my-0" />
            <div className="p-1">
              <DropdownMenuItem onSelect={() => onAssign(null)}>
                Quitar asignación
              </DropdownMenuItem>
            </div>
          </>
        )}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
};

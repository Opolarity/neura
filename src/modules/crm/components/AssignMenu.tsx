import { useEffect, useState } from "react";
import { Check, ChevronDown, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/modules/auth";
import { cn } from "@/shared/utils/utils";
import { getErpUsersApi, type ErpUser } from "../services/crm.service";

interface Props {
  assignedTo: string | null;
  disabled?: boolean;
  onAssign: (userId: string | null) => void;
}

/**
 * Único punto para asignar una conversación: desde acá se elige a uno mismo o
 * a otra persona. Antes había además un botón "Asignármela", y tener dos
 * caminos para lo mismo obligaba a mirar los dos para saber quién la tiene.
 *
 * Quien no puede repartir el trabajo del equipo (sin crm_conversations.assign_any)
 * ve el menú igual, pero solo con la opción de tomarla para sí. Así el permiso
 * de supervisión sigue significando algo sin dejar al asesor sin forma de
 * hacerse cargo de un chat.
 *
 * La lista de usuarios se carga la PRIMERA vez que se abre el menú y no al
 * montar la pantalla: son hasta 100 usuarios que la mayoría de las veces no se
 * van a mirar.
 */
export const AssignMenu = ({ assignedTo, disabled, onAssign }: Props) => {
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

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 px-2 text-xs" disabled={disabled}>
          <UserCog className="mr-1 h-3.5 w-3.5" />
          Asignar a…
          <ChevronDown className="ml-1 h-3 w-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64 p-0">
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

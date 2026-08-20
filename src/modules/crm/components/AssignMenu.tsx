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
import { cn } from "@/shared/utils/utils";
import { getErpUsersApi, type ErpUser } from "../services/crm.service";

interface Props {
  assignedTo: string | null;
  disabled?: boolean;
  onAssign: (userId: string | null) => void;
}

/**
 * Selector de responsable, para quien pueda repartir el trabajo del equipo.
 *
 * La lista se carga la PRIMERA vez que se abre el menú y no al montar la
 * pantalla: son hasta 100 usuarios que la mayoría de las veces no se van a
 * mirar, y pedirlos con cada conversación que se abre es tráfico regalado.
 */
export const AssignMenu = ({ assignedTo, disabled, onAssign }: Props) => {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<ErpUser[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    if (!open || users !== null || loading) return;

    setLoading(true);
    getErpUsersApi()
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [open, users, loading]);

  const visible = (users ?? []).filter((u) =>
    u.name.toLowerCase().includes(filter.trim().toLowerCase())
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <UserCog className="mr-1.5 h-4 w-4" />
          Asignar a…
          <ChevronDown className="ml-1 h-3.5 w-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64 p-0">
        <div className="p-2">
          <Input
            autoFocus
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Buscar asesor…"
            className="h-8"
          />
        </div>

        <DropdownMenuSeparator className="my-0" />

        <ScrollArea className="max-h-64">
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

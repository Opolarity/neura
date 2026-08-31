import { Edit, Trash, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users } from "../../types/Users.types";
import { format } from "date-fns";
import { ComponentPermission } from "@/shared/components/component-permission";

// Usuario, Nombres, Documentos, Almacen, Sucursales, Roles, Fecha de Creación,
// Acciones. Si el rol no puede editar ni eliminar, la columna de Acciones no se
// pinta y este número queda uno largo: solo afecta a las filas de "cargando" y
// "no se encontraron usuarios", y la columna sobrante colapsa a 0px porque
// ninguna otra fila la ocupa.
const COL_SPAN = 8;

// Codes de la columna Acciones, en una constante para que la cabecera y la
// celda no puedan quedar con listas distintas y aparezca un th sin td o al
// revés.
const ACTION_CODES = ["users.edit", "users.delete"];

interface UsersTableProps {
  users: Users[];
  loading: boolean;
  onEdit: (user: Users) => void;
  onDeleteClick: (user: Users) => void;
}

const UsersTable = ({ users, loading, onEdit, onDeleteClick }: UsersTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Usuario</TableHead>
          <TableHead>Nombres</TableHead>
          <TableHead>Documentos</TableHead>
          <TableHead>Almacen</TableHead>
          <TableHead>Sucursales</TableHead>
          <TableHead>Roles</TableHead>
          <TableHead>Fecha de Creación</TableHead>
          {/* Se envuelve el th entero y no su texto: una celda vacía sigue
              ocupando su ancho y deja un hueco muerto. */}
          <ComponentPermission codeIn={ACTION_CODES}>
            <TableHead>Acciones</TableHead>
          </ComponentPermission>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading && users.length === 0 ? (
          <TableRow>
            <TableCell colSpan={COL_SPAN} className="text-center py-8">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando usuarios...
              </div>
            </TableCell>
          </TableRow>
        ) : users.length === 0 ? (
          <TableRow>
            <TableCell colSpan={COL_SPAN} className="text-center">
              No se encontraron usuarios
            </TableCell>
          </TableRow>
        ) : (
          users.map((u) => (
            <TableRow key={u.profiles_id}>
              <TableCell>{u.user_name}</TableCell>
              <TableCell>{u.name}</TableCell>
              <TableCell>{u.document_number}</TableCell>
              <TableCell>{u.warehouse}</TableCell>
              <TableCell>{u.branches || "Sin sucursal"}</TableCell>
              <TableCell>{u.role || "Sin roles"}</TableCell>
              <TableCell>
                {u.created_at
                  ? format(
                    new Date(u.created_at.split("T")[0].replace(/-/g, "/")),
                    "dd/MM/yyyy",
                  )
                  : "-"}
              </TableCell>
              <ComponentPermission codeIn={ACTION_CODES}>
                <TableCell>
                  <div className="flex gap-2">
                    {/* El botón lleva a /settings/users/edit/:uid, ya protegida
                        con users.edit: se reutiliza ese code. */}
                    <ComponentPermission codeIn={["users.edit"]}>
                      <Button variant="outline" size="sm" title="Editar el usuario" onClick={() => onEdit(u)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </ComponentPermission>
                    <ComponentPermission codeIn={["users.delete"]}>
                      <Button
                        variant="destructive"
                        size="sm"
                        title="Eliminar el usuario"
                        onClick={() => onDeleteClick(u)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </ComponentPermission>
                  </div>
                </TableCell>
              </ComponentPermission>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default UsersTable;

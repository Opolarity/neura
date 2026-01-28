import { Edit, Trash2 } from "lucide-react";
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

interface UsersTableProps {
  users: Users[];
  loading: boolean;
  onEdit: (user: Users) => void;
  onDelete: (id: string) => void;
}

const UsersTable = ({ users, loading, onEdit, onDelete }: UsersTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Nombres</TableHead>
          <TableHead>Documentos</TableHead>
          <TableHead>Almacen</TableHead>
          <TableHead>Sucursales</TableHead>
          <TableHead>Roles</TableHead>
          <TableHead>Fecha de Creación</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={8} className="text-center">
              Cargando usuarios...
            </TableCell>
          </TableRow>
        ) : users.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="text-center">
              No se encontraron usuarios
            </TableCell>
          </TableRow>
        ) : (
          users.map((u) => (
            <TableRow key={u.id}>
              <TableCell>{u.id}</TableCell>
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
              <TableCell>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(u)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => onDelete(u.profiles_id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default UsersTable;

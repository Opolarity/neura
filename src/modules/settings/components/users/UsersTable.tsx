import { Edit, Link, Shield, Trash2, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
}

const UsersTable = ({ users, loading }: UsersTableProps) => {
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
                {format(
                  new Date(u.created_at.split("T")[0].replace(/-/g, "/")),
                  "dd/MM/yyyy",
                )}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="icon">
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

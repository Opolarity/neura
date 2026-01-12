import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Client } from '../types';

interface ClientsTableProps {
  clients: Client[];
  loading: boolean;
  onEdit: (clientId: number) => void;
  onDelete: (clientId: number) => void;
}

export const ClientsTable = ({ clients, loading, onEdit, onDelete }: ClientsTableProps) => {
  const formatCurrency = (amount: number) => {
    return `S/ ${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Cargando clientes...</div>
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">No hay clientes registrados</div>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">ID</TableHead>
          <TableHead>Nombre</TableHead>
          <TableHead>DNI</TableHead>
          <TableHead className="text-center">Compras</TableHead>
          <TableHead className="text-right">Monto</TableHead>
          <TableHead>Fecha de creación</TableHead>
          <TableHead className="text-center w-28">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clients.map((client) => (
          <TableRow key={client.id}>
            <TableCell className="font-medium">{client.id}</TableCell>
            <TableCell>{client.fullName}</TableCell>
            <TableCell>{client.documentNumber}</TableCell>
            <TableCell className="text-center">{client.purchaseCount}</TableCell>
            <TableCell className="text-right">{formatCurrency(client.totalAmount)}</TableCell>
            <TableCell>{formatDate(client.createdAt)}</TableCell>
            <TableCell>
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(client.id)}
                  className="h-8 w-8"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(client.id)}
                  className="h-8 w-8 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

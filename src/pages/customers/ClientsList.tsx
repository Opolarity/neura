import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, Pencil } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

interface Client {
  id: number;
  name: string;
  middle_name?: string;
  last_name: string;
  last_name2?: string;
  document_number: string;
  document_type_id: number;
  created_at: string;
}

const ClientsList = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error: any) {
      toast.error('Error al cargar clientes: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getFullName = (client: Client) => {
    const parts = [
      client.name,
      client.middle_name,
      client.last_name,
      client.last_name2
    ].filter(Boolean);
    return parts.join(' ');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Listado de Clientes</h1>
        <Button onClick={() => navigate('/customers/create')}>
          <Plus className="mr-2 h-4 w-4" />
          Añadir Cliente
        </Button>
      </div>

      {loading ? (
        <p>Cargando clientes...</p>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nombre Completo</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Fecha de Creación</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No hay clientes registrados
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>{client.id}</TableCell>
                    <TableCell>{getFullName(client)}</TableCell>
                    <TableCell>{client.document_number}</TableCell>
                    <TableCell>
                      {new Date(client.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/customers/edit/${client.id}`)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default ClientsList;

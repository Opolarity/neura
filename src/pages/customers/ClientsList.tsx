import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { Card } from 'primereact/card';
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
  purchase_count?: number;
}

const ClientsList = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (clientsError) throw clientsError;

      // Fetch order counts for each client
      if (clientsData && clientsData.length > 0) {
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('document_type, document_number');

        if (ordersError) throw ordersError;

        // Count orders by document
        const orderCounts = new Map<string, number>();
        ordersData?.forEach((order) => {
          const key = `${order.document_type}-${order.document_number}`;
          orderCounts.set(key, (orderCounts.get(key) || 0) + 1);
        });

        // Add purchase counts to clients
        const clientsWithCounts = clientsData.map((client) => {
          const key = `${client.document_type_id}-${client.document_number}`;
          return {
            ...client,
            purchase_count: orderCounts.get(key) || 0,
          };
        });

        setClients(clientsWithCounts);
      } else {
        setClients([]);
      }
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

  const fullNameBodyTemplate = (rowData: Client) => {
    return getFullName(rowData);
  };

  const dateBodyTemplate = (rowData: Client) => {
    return new Date(rowData.created_at).toLocaleDateString();
  };

  const actionBodyTemplate = (rowData: Client) => {
    return (
      <Button
        icon="pi pi-pencil"
        rounded
        text
        severity="info"
        onClick={() => navigate(`/customers/edit/${rowData.id}`)}
      />
    );
  };

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <h2 className="m-0 text-xl font-bold">Listado de Clientes</h2>
      <div className="flex gap-2">
        <IconField iconPosition="left">
          <InputIcon className="pi pi-search" />
          <InputText type="search" onInput={(e: React.ChangeEvent<HTMLInputElement>) => setGlobalFilter(e.target.value)} placeholder="Buscar..." />
        </IconField>
        <Button label="Añadir Cliente" icon="pi pi-plus" onClick={() => navigate('/customers/create')} />
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <Card className="shadow-sm">
        <DataTable
          value={clients}
          loading={loading}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          header={header}
          globalFilter={globalFilter}
          emptyMessage="No se encontraron clientes"
          className="p-datatable-sm"
        >
          <Column field="id" header="ID" sortable></Column>
          <Column header="Nombre Completo" body={fullNameBodyTemplate} sortable field="name"></Column>
          <Column field="document_number" header="Documento" sortable></Column>
          <Column field="purchase_count" header="Compras" sortable></Column>
          <Column header="Fecha de Creación" body={dateBodyTemplate} sortable field="created_at"></Column>
          <Column header="Acciones" body={actionBodyTemplate} style={{ width: '5rem', textAlign: 'center' }}></Column>
        </DataTable>
      </Card>
    </div>
  );
};

export default ClientsList;

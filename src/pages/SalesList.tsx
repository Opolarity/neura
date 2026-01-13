import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast'; // We can keep using this hook or switch to PrimeReact toast if we add a Toast component.
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { InputText } from 'primereact/inputtext';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { Toolbar } from 'primereact/toolbar';
import { format } from 'date-fns';

interface Order {
  id: number;
  date: string;
  document_number: string;
  customer_name: string;
  customer_lastname: string;
  total: number;
  created_at: string;
  sale_types: {
    name: string;
  };
  order_situations: Array<{
    situations: {
      name: string;
      statuses: {
        code: string;
      };
    };
  }>;
}

const SalesList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState<string>('');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, 
          date, 
          document_number, 
          customer_name, 
          customer_lastname, 
          total, 
          created_at,
          sale_types(name),
          order_situations!inner(
            situations(
              name,
              statuses(code)
            )
          )
        `)
        .eq('order_situations.last_row', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las ventas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const dateBodyTemplate = (rowData: Order) => {
    return rowData.date
      ? format(new Date(rowData.date), 'dd/MM/yyyy')
      : format(new Date(rowData.created_at), 'dd/MM/yyyy');
  };

  const clientBodyTemplate = (rowData: Order) => {
    return `${rowData.customer_name} ${rowData.customer_lastname}`;
  };

  const channelBodyTemplate = (rowData: Order) => {
    return rowData.sale_types?.name || '-';
  };

  const statusBodyTemplate = (rowData: Order) => {
    const situation = rowData.order_situations?.[0]?.situations;
    if (!situation) return '-';

    const code = situation.statuses.code;
    let severity: "success" | "info" | "warning" | "danger" | null = null;

    if (code === 'CFM') severity = 'success'; // Confirmado
    else if (code === 'CAN') severity = 'danger'; // Cancelado
    else if (code === 'RES') severity = 'warning'; // Reservado
    else severity = 'info';

    return <Tag value={situation.name} severity={severity} rounded />;
  };

  const totalBodyTemplate = (rowData: Order) => {
    return `S/ ${Number(rowData.total).toFixed(2)}`;
  };

  const actionBodyTemplate = (rowData: Order) => {
    return (
      <div className="flex gap-2 justify-content-center">
        <Button icon="pi pi-pencil" rounded text severity="info" onClick={() => navigate(`/sales/edit/${rowData.id}`)} />
        <Button icon="pi pi-eye" rounded text severity="secondary" onClick={() => navigate(`/sales/${rowData.id}`)} />
      </div>
    );
  };

  const leftToolbarTemplate = () => {
    return (
      <div className="flex flex-wrap gap-2">
        <h1 className="text-3xl font-bold font-gray-900 mr-4">Listado de Ventas</h1>
      </div>
    );
  };

  const rightToolbarTemplate = () => {
    return (
      <Button label="Nueva Venta" icon="pi pi-plus" onClick={() => navigate('/sales/create')} />
    );
  };

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <h4 className="m-0">Ventas</h4>
      <IconField iconPosition="left">
        <InputIcon className="pi pi-search" />
        <InputText type="search" onInput={(e: React.ChangeEvent<HTMLInputElement>) => setGlobalFilter(e.target.value)} placeholder="Buscar ventas..." />
      </IconField>
    </div>
  );

  return (
    <div className="p-6">
      <Toolbar className="mb-4 bg-white border-none shadow-sm" start={leftToolbarTemplate} end={rightToolbarTemplate}></Toolbar>

      <div className="card shadow-sm rounded-lg overflow-hidden bg-white">
        <DataTable
          value={orders}
          loading={loading}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          header={header}
          globalFilter={globalFilter}
          emptyMessage="No hay ventas registradas"
          className="p-datatable-sm"
          sortField="created_at"
          sortOrder={-1}
        >
          <Column field="id" header="ID" sortable className="font-medium"></Column>
          <Column header="Fecha" body={dateBodyTemplate} sortable field="created_at"></Column>
          <Column field="document_number" header="Documento" sortable></Column>
          <Column header="Cliente" body={clientBodyTemplate} sortable field="customer_name"></Column>
          <Column header="Canal" body={channelBodyTemplate} sortable field="sale_types.name"></Column>
          <Column header="Estado" body={statusBodyTemplate} sortable></Column>
          <Column header="Total" body={totalBodyTemplate} sortable field="total" className="text-right"></Column>
          <Column header="Acciones" body={actionBodyTemplate} style={{ width: '8rem', textAlign: 'center' }}></Column>
        </DataTable>
      </div>
    </div>
  );
};

export default SalesList;

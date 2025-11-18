import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface Return {
  id: number;
  order_id: number;
  customer_document_number: string;
  reason: string | null;
  shipping_return: boolean;
  total_refund_amount: number | null;
  total_exchange_difference: number | null;
  created_at: string;
  statuses: {
    name: string;
  };
  situations: {
    name: string;
  };
  types: {
    name: string;
  };
}

const Returns = () => {
  const navigate = useNavigate();
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReturns();
  }, []);

  const loadReturns = async () => {
    try {
      const { data, error } = await supabase
        .from('returns')
        .select(`
          *,
          statuses(name),
          situations(name),
          types(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReturns(data || []);
    } catch (error: any) {
      console.error('Error loading returns:', error);
      toast.error('Error al cargar las devoluciones');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">Cargando devoluciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Devoluciones</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona las devoluciones y cambios de productos
          </p>
        </div>
        <Button onClick={() => navigate('/returns/add')}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Devolución
        </Button>
      </div>

      {returns.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No hay devoluciones registradas</p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Pedido</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Situación</TableHead>
                <TableHead>Reembolso</TableHead>
                <TableHead>Diferencia</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {returns.map((returnItem) => (
                <TableRow key={returnItem.id}>
                  <TableCell className="font-medium">#{returnItem.id}</TableCell>
                  <TableCell>#{returnItem.order_id}</TableCell>
                  <TableCell>{returnItem.customer_document_number}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {returnItem.types?.name || 'N/A'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {returnItem.statuses?.name || 'N/A'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge>
                      {returnItem.situations?.name || 'N/A'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatCurrency(returnItem.total_refund_amount)}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(returnItem.total_exchange_difference)}
                  </TableCell>
                  <TableCell>{formatDate(returnItem.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/returns/${returnItem.id}`)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default Returns;

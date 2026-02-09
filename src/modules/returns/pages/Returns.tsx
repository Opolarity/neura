import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useReturns } from '../hooks/useReturns';
import { ReturnsTable } from '../components/returns/ReturnsTable';

const Returns = () => {
  const navigate = useNavigate();
  const { returns, loading, formatDate, formatCurrency } = useReturns();

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
        <ReturnsTable
          returns={returns}
          formatDate={formatDate}
          formatCurrency={formatCurrency}
        />
      )}
    </div>
  );
};

export default Returns;

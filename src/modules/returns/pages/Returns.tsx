import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useReturns } from '../hooks/useReturns';
import { ReturnsTable } from '../components/returns/ReturnsTable';
import { ComponentPermission } from '@/shared/components/component-permission';

const Returns = () => {
  const navigate = useNavigate();
  const { returns, loading, formatDate, formatCurrency, search, handleSearchChange, pagination, handlePageChange, handlePageSizeChange } = useReturns();

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Devoluciones</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona las devoluciones y cambios de productos
          </p>
        </div>
        {/* El botón lleva a /returns/add, que ya está protegida con
            returns.create. Se reutiliza ese mismo code aquí para no ofrecer un
            botón que acaba en una pantalla bloqueada. */}
        <ComponentPermission codeIn={["returns.create"]}>
          <Button onClick={() => navigate('/returns/add')}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Devolución
          </Button>
        </ComponentPermission>
      </div>

      <ReturnsTable
        returns={returns}
        loading={loading}
        formatDate={formatDate}
        formatCurrency={formatCurrency}
        search={search}
        onSearchChange={handleSearchChange}
        pagination={pagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  );
};

export default Returns;

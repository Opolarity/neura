import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useReturns } from '../hooks/useReturns';
import { ReturnsTable } from '../components/returns/ReturnsTable';

const Returns = () => {
  const navigate = useNavigate();
  const { returns, loading, formatDate, formatCurrency, search, handleSearchChange, pagination, handlePageChange, handlePageSizeChange } = useReturns();

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

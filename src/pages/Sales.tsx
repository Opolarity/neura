import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const Sales = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Ventas</h1>
        <Button onClick={() => navigate('/sales/create')}>
          <Plus className="w-4 h-4 mr-2" />
          Crear Venta
        </Button>
      </div>
      <p className="text-gray-600">Funcionalidad en desarrollo</p>
    </div>
  );
};

export default Sales;
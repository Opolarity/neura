import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { AlertTriangle, Package, TrendingDown, Plus } from 'lucide-react';

const Inventory = () => {
  const [inventory] = useState([
    {
      id: 1,
      product: 'Camiseta OVERTAKE Classic',
      sku: 'OVT-001',
      currentStock: 45,
      minStock: 20,
      maxStock: 100,
      location: 'A1-B2',
      lastUpdated: '2024-01-15'
    },
    {
      id: 2,
      product: 'Pantalón Deportivo Pro',
      sku: 'OVT-002',
      currentStock: 23,
      minStock: 30,
      maxStock: 80,
      location: 'A2-C1',
      lastUpdated: '2024-01-14'
    },
    {
      id: 3,
      product: 'Sudadera Urban Style',
      sku: 'OVT-003',
      currentStock: 8,
      minStock: 15,
      maxStock: 60,
      location: 'B1-A3',
      lastUpdated: '2024-01-13'
    }
  ]);

  const lowStockItems = inventory.filter(item => item.currentStock <= item.minStock);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Control de Inventario</h1>
          <p className="text-gray-600">Monitorea y gestiona tu inventario</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Ajuste de Inventario
        </Button>
      </div>

      {/* Alertas de Stock */}
      {lowStockItems.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-semibold">Alerta de Stock Bajo</h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-2 px-3 bg-white rounded-lg">
                  <span className="font-medium">{item.product}</span>
                  <span className="text-red-600">{item.currentStock} / {item.minStock} unidades</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumen de Inventario */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Productos</p>
                <p className="text-2xl font-bold">76</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Stock Bajo</p>
                <p className="text-2xl font-bold text-red-600">{lowStockItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-full">
                <TrendingDown className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Valor Inventario</p>
                <p className="text-2xl font-bold">$12,450</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Inventario */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Detalle de Inventario</h3>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Stock Actual</TableHead>
                <TableHead>Min / Max</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Última Actualización</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.product}</TableCell>
                  <TableCell>{item.sku}</TableCell>
                  <TableCell>{item.currentStock}</TableCell>
                  <TableCell>{item.minStock} / {item.maxStock}</TableCell>
                  <TableCell>{item.location}</TableCell>
                  <TableCell>{item.lastUpdated}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      item.currentStock <= item.minStock
                        ? 'bg-red-100 text-red-800'
                        : item.currentStock >= item.maxStock
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {item.currentStock <= item.minStock ? 'Stock Bajo' : 
                       item.currentStock >= item.maxStock ? 'Stock Alto' : 'Normal'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Inventory;

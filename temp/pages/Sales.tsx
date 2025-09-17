import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Plus, Eye, Download, Filter } from 'lucide-react';

const Sales = () => {
  const [sales] = useState([
    {
      id: 'VTA-001',
      customer: 'María García',
      date: '2024-01-15',
      items: 3,
      total: 125.50,
      status: 'Completada',
      paymentMethod: 'Tarjeta'
    },
    {
      id: 'VTA-002',
      customer: 'Carlos López',
      date: '2024-01-15',
      items: 2,
      total: 89.99,
      status: 'Completada',
      paymentMethod: 'Efectivo'
    },
    {
      id: 'VTA-003',
      customer: 'Ana Martínez',
      date: '2024-01-14',
      items: 5,
      total: 234.00,
      status: 'Pendiente',
      paymentMethod: 'Transferencia'
    },
    {
      id: 'VTA-004',
      customer: 'Luis Rodríguez',
      date: '2024-01-14',
      items: 1,
      total: 65.99,
      status: 'Completada',
      paymentMethod: 'Tarjeta'
    }
  ]);

  const todaySales = sales.filter(sale => sale.date === '2024-01-15');
  const totalToday = todaySales.reduce((sum, sale) => sum + sale.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Ventas</h1>
          <p className="text-gray-600">Administra y monitorea tus ventas</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nueva Venta
        </Button>
      </div>

      {/* Resumen de Ventas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Ventas Hoy</p>
              <p className="text-2xl font-bold text-green-600">${totalToday.toFixed(2)}</p>
              <p className="text-xs text-gray-500">{todaySales.length} transacciones</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Ventas del Mes</p>
              <p className="text-2xl font-bold text-blue-600">$4,230</p>
              <p className="text-xs text-gray-500">45 transacciones</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Ticket Promedio</p>
              <p className="text-2xl font-bold text-purple-600">$89.50</p>
              <p className="text-xs text-gray-500">Por transacción</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Clientes Únicos</p>
              <p className="text-2xl font-bold text-orange-600">23</p>
              <p className="text-xs text-gray-500">Este mes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Ventas */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Historial de Ventas</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="w-4 h-4" />
                Filtrar
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Venta</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Artículos</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Método de Pago</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-medium">{sale.id}</TableCell>
                  <TableCell>{sale.customer}</TableCell>
                  <TableCell>{sale.date}</TableCell>
                  <TableCell>{sale.items}</TableCell>
                  <TableCell>${sale.total.toFixed(2)}</TableCell>
                  <TableCell>{sale.paymentMethod}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      sale.status === 'Completada' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {sale.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Eye className="w-4 h-4" />
                      Ver
                    </Button>
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

export default Sales;

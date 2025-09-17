import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Plus, Download, Send, Eye } from 'lucide-react';

const Invoices = () => {
  const [invoices] = useState([
    {
      id: 'FAC-001',
      customer: 'María García',
      date: '2024-01-15',
      dueDate: '2024-02-14',
      amount: 125.50,
      tax: 22.59,
      total: 148.09,
      status: 'Pagada'
    },
    {
      id: 'FAC-002',
      customer: 'Carlos López',
      date: '2024-01-14',
      dueDate: '2024-02-13',
      amount: 89.99,
      tax: 16.20,
      total: 106.19,
      status: 'Enviada'
    },
    {
      id: 'FAC-003',
      customer: 'Ana Martínez',
      date: '2024-01-13',
      dueDate: '2024-02-12',
      amount: 234.00,
      tax: 42.12,
      total: 276.12,
      status: 'Vencida'
    },
    {
      id: 'FAC-004',
      customer: 'Luis Rodríguez',
      date: '2024-01-12',
      dueDate: '2024-02-11',
      amount: 65.99,
      tax: 11.88,
      total: 77.87,
      status: 'Borrador'
    }
  ]);

  const totalPaid = invoices.filter(inv => inv.status === 'Pagada').reduce((sum, inv) => sum + inv.total, 0);
  const totalPending = invoices.filter(inv => inv.status === 'Enviada').reduce((sum, inv) => sum + inv.total, 0);
  const totalOverdue = invoices.filter(inv => inv.status === 'Vencida').reduce((sum, inv) => sum + inv.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Facturación</h1>
          <p className="text-gray-600">Gestiona tus facturas y cobros</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nueva Factura
        </Button>
      </div>

      {/* Resumen de Facturación */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Cobrado</p>
              <p className="text-2xl font-bold text-green-600">${totalPaid.toFixed(2)}</p>
              <p className="text-xs text-gray-500">Este mes</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Por Cobrar</p>
              <p className="text-2xl font-bold text-blue-600">${totalPending.toFixed(2)}</p>
              <p className="text-xs text-gray-500">Pendientes</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Vencidas</p>
              <p className="text-2xl font-bold text-red-600">${totalOverdue.toFixed(2)}</p>
              <p className="text-xs text-gray-500">Requieren acción</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Facturas</p>
              <p className="text-2xl font-bold text-purple-600">{invoices.length}</p>
              <p className="text-xs text-gray-500">Este mes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Facturas */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Lista de Facturas</h3>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Exportar Todas
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Subtotal</TableHead>
                <TableHead>Impuestos</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.id}</TableCell>
                  <TableCell>{invoice.customer}</TableCell>
                  <TableCell>{invoice.date}</TableCell>
                  <TableCell>{invoice.dueDate}</TableCell>
                  <TableCell>${invoice.amount.toFixed(2)}</TableCell>
                  <TableCell>${invoice.tax.toFixed(2)}</TableCell>
                  <TableCell className="font-medium">${invoice.total.toFixed(2)}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      invoice.status === 'Pagada' ? 'bg-green-100 text-green-800' :
                      invoice.status === 'Enviada' ? 'bg-blue-100 text-blue-800' :
                      invoice.status === 'Vencida' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {invoice.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                      {invoice.status !== 'Pagada' && (
                        <Button variant="outline" size="sm">
                          <Send className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
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

export default Invoices;

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, TrendingUp, Package, DollarSign } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Reports = () => {
  const [salesData, setSalesData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [movementsByCategory, setMovementsByCategory] = useState<any[]>([]);
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  useEffect(() => {
    loadReportsData();
  }, [period]);

  const loadReportsData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadSalesData(),
        loadTopProducts(),
        loadLowStock(),
        loadMovementsByCategory()
      ]);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSalesData = async () => {
    const daysAgo = period === 'week' ? 7 : period === 'month' ? 30 : 365;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    const { data, error } = await supabase
      .from('orders')
      .select('created_at, total')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    const grouped = data?.reduce((acc: any, order: any) => {
      const date = new Date(order.created_at).toLocaleDateString('es-ES', { 
        month: 'short', 
        day: 'numeric' 
      });
      if (!acc[date]) {
        acc[date] = { date, total: 0, count: 0 };
      }
      acc[date].total += Number(order.total);
      acc[date].count += 1;
      return acc;
    }, {});

    setSalesData(Object.values(grouped || {}));
  };

  const loadTopProducts = async () => {
    const { data, error } = await supabase
      .from('order_products')
      .select(`
        product_variation_id,
        quantity,
        variations!inner(
          product_id,
          products!inner(title)
        )
      `);

    if (error) throw error;

    const grouped = data?.reduce((acc: any, item: any) => {
      const productTitle = item.variations?.products?.title || 'Desconocido';
      if (!acc[productTitle]) {
        acc[productTitle] = { name: productTitle, value: 0 };
      }
      acc[productTitle].value += Number(item.quantity);
      return acc;
    }, {});

    const sorted = Object.values(grouped || {})
      .sort((a: any, b: any) => b.value - a.value)
      .slice(0, 6);

    setTopProducts(sorted);
  };

  const loadLowStock = async () => {
    const { data, error } = await supabase
      .from('product_stock')
      .select(`
        stock,
        variations!inner(
          product_id,
          sku,
          products!inner(title)
        ),
        warehouses!inner(name)
      `)
      .lte('stock', 10)
      .order('stock', { ascending: true })
      .limit(10);

    if (error) throw error;

    const formatted = data?.map(item => ({
      product: item.variations?.products?.title || 'Desconocido',
      sku: item.variations?.sku || 'N/A',
      warehouse: item.warehouses?.name || 'N/A',
      stock: item.stock
    }));

    setLowStock(formatted || []);
  };

  const loadMovementsByCategory = async () => {
    const { data, error } = await supabase
      .from('movements')
      .select(`
        amount,
        movement_type_id,
        movement_types!inner(name),
        movement_categories!inner(name)
      `);

    if (error) throw error;

    const grouped = data?.reduce((acc: any, item: any) => {
      const category = item.movement_categories?.name || 'Otros';
      if (!acc[category]) {
        acc[category] = { name: category, ingresos: 0, egresos: 0 };
      }
      
      const amount = Number(item.amount);
      if (item.movement_type_id === 1) {
        acc[category].ingresos += amount;
      } else {
        acc[category].egresos += amount;
      }
      return acc;
    }, {});

    setMovementsByCategory(Object.values(grouped || {}));
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Cargando reportes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reportes</h1>
          <p className="text-muted-foreground mt-1">Análisis y estadísticas del sistema</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Última semana</SelectItem>
            <SelectItem value="month">Último mes</SelectItem>
            <SelectItem value="year">Último año</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales">
            <TrendingUp className="w-4 h-4 mr-2" />
            Ventas
          </TabsTrigger>
          <TabsTrigger value="products">
            <Package className="w-4 h-4 mr-2" />
            Productos
          </TabsTrigger>
          <TabsTrigger value="inventory">
            <Calendar className="w-4 h-4 mr-2" />
            Inventario
          </TabsTrigger>
          <TabsTrigger value="movements">
            <DollarSign className="w-4 h-4 mr-2" />
            Movimientos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ventas por Período</CardTitle>
              <CardDescription>Total de ventas y cantidad de órdenes</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="total" 
                    stroke="#3b82f6" 
                    name="Total ($)"
                    strokeWidth={2}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="count" 
                    stroke="#10b981" 
                    name="Cantidad"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Productos Más Vendidos</CardTitle>
              <CardDescription>Top 6 productos por cantidad vendida</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={topProducts}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {topProducts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventario Bajo</CardTitle>
              <CardDescription>Productos con stock menor o igual a 10 unidades</CardDescription>
            </CardHeader>
            <CardContent>
              {lowStock.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay productos con stock bajo
                </div>
              ) : (
                <div className="space-y-2">
                  {lowStock.map((item, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{item.product}</p>
                        <p className="text-sm text-muted-foreground">
                          SKU: {item.sku} • {item.warehouse}
                        </p>
                      </div>
                      <div className={`text-lg font-bold px-3 py-1 rounded ${
                        item.stock <= 5 ? 'bg-destructive/10 text-destructive' : 'bg-yellow-500/10 text-yellow-600'
                      }`}>
                        {item.stock}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Movimientos por Categoría</CardTitle>
              <CardDescription>Comparación de ingresos y egresos</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={movementsByCategory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="ingresos" fill="#10b981" name="Ingresos" />
                  <Bar dataKey="egresos" fill="#ef4444" name="Egresos" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;

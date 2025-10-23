import React from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/card';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  ShoppingCart, 
  Users, 
  DollarSign 
} from 'lucide-react';

const Dashboard = () => {
  const stats = [
    {
      title: 'Ventas del Mes',
      value: 'S/ 45,230',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      title: 'Productos en Stock',
      value: '1,234',
      change: '-2.1%',
      trend: 'down',
      icon: Package,
      color: 'text-blue-600'
    },
    {
      title: 'Órdenes Pendientes',
      value: '23',
      change: '+5.4%',
      trend: 'up',
      icon: ShoppingCart,
      color: 'text-orange-600'
    },
    {
      title: 'Clientes Activos',
      value: '890',
      change: '+8.2%',
      trend: 'up',
      icon: Users,
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Bienvenido al ERP de OVERTAKE</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown;
          
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendIcon className={`w-4 h-4 ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`} />
                      <span className={`text-sm ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-full bg-gray-100 ${stat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Ventas Recientes</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { id: '#001', customer: 'María García', amount: 'S/ 125.00', time: '2 min ago' },
                { id: '#002', customer: 'Carlos López', amount: 'S/ 89.50', time: '15 min ago' },
                { id: '#003', customer: 'Ana Martínez', amount: 'S/ 234.00', time: '1 hora ago' },
              ].map((sale) => (
                <div key={sale.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium">{sale.customer}</p>
                    <p className="text-sm text-gray-500">Orden {sale.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{sale.amount}</p>
                    <p className="text-sm text-gray-500">{sale.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Productos con Stock Bajo</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'Camiseta OVERTAKE Classic', stock: 5, min: 10 },
                { name: 'Pantalón Deportivo Pro', stock: 3, min: 15 },
                { name: 'Sudadera Urban Style', stock: 8, min: 12 },
              ].map((product, index) => (
                <div key={index} className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-500">Mínimo: {product.min}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                      {product.stock} unidades
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
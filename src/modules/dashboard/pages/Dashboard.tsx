import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { getParameter } from "@/modules/settings/services/Parameters.service";

interface DashboardData {
  ventas_del_mes: number;
  productos_stock: number;
  ordenes_pendientes: number;
  clientes_activos: number;
  ventas_recientes: {
    id: number;
    customer: string;
    amount: number;
    time: string;
  }[];
  productos_stock_bajo: {
    name: string;
    stock: number;
    min: number;
  }[];
}

const Dashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState("");
  const [lowStockProducts, setLowStockProducts] = useState<DashboardData["productos_stock_bajo"]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
    getParameter("CompanyShortName").then(setCompanyName);
    fetchLowStock();
  }, []);

  const fetchLowStock = async () => {
    const { data: result, error } = await supabase.rpc("sp_rpt_low_stock_products", {
      p_threshold: 4,
      p_page: 1,
      p_size: 10,
    });
    if (!error && result?.data) {
      setLowStockProducts(
        (result.data as any[])
          .filter((p) => p.stock > 0)
          .map((p) => ({ name: p.product_title, stock: p.stock, min: 5 })),
      );
    }
  };

  const fetchDashboardData = async () => {
    try {
      const { data: result, error } =
        await supabase.functions.invoke("get-dashboard-data");
      if (error) throw error;

      // Some simple conversions incase numbers arrive as strings from postgres numeric
      if (result) {
        result.ventas_del_mes = Number(result.ventas_del_mes || 0);
        result.productos_stock = Number(result.productos_stock || 0);
        result.ordenes_pendientes = Number(result.ordenes_pendientes || 0);
        result.clientes_activos = Number(result.clientes_activos || 0);
      }

      setData(result);
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error",
        description: "No se pudo cargar la data del dashboard.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
    }).format(amount);
  };

  const formatRelativeTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), {
        addSuffix: true,
        locale: es,
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = [
    {
      title: "Ventas del Mes",
      value: formatCurrency(data?.ventas_del_mes || 0),
      trend: "up",
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      title: "Productos en Stock",
      value: (data?.productos_stock || 0).toLocaleString("es-PE"),
      trend: "up",
      icon: Package,
      color: "text-blue-600",
    },
    {
      title: "Órdenes Pendientes",
      value: (data?.ordenes_pendientes || 0).toString(),
      trend: "up",
      icon: ShoppingCart,
      color: "text-orange-600",
    },
    {
      title: "Clientes Activos del mes",
      value: (data?.clientes_activos || 0).toString(),
      trend: "up",
      icon: Users,
      color: "text-purple-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Bienvenido al ERP de {companyName}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === "up" ? TrendingUp : TrendingDown;

          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </p>
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
              {!data?.ventas_recientes?.length ? (
                <p className="text-sm text-gray-500 italic">
                  No hay ventas recientes
                </p>
              ) : (
                data.ventas_recientes.map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between py-2"
                  >
                    <div>
                      <p className="font-medium">
                        {sale.customer || "Cliente Genérico"}
                      </p>
                      <p className="text-sm text-gray-500">Orden #{sale.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(sale.amount)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatRelativeTime(sale.time)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Productos con Stock Bajo</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!lowStockProducts.length ? (
                <p className="text-sm text-gray-500 italic">
                  Todos los productos tienen buen stock
                </p>
              ) : (
                lowStockProducts.map((product, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2"
                  >
                    <div>
                      <p
                        className="font-medium max-w-[200px] truncate"
                        title={product.name}
                      >
                        {product.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Mínimo sugerido: {product.min}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                        {product.stock} unidades
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

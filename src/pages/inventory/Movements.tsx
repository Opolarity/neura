import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, TrendingDown, TrendingUp, Search, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface StockMovement {
  id: number;
  quantity: number;
  created_at: string;
  movement_type: number;
  order_id: number | null;
  return_id?: number | null;
  product_variation_id: number;
  created_by: string;
  out_warehouse_id: number;
  in_warehouse_id: number;
  defect_stock: boolean;
  variations: {
    id: number;
    sku: string | null;
    products: {
      id: number;
      title: string;
    };
    variation_terms: {
      terms: {
        id: number;
        name: string;
      };
    }[];
  };
  types: {
    id: number;
    name: string;
  };
  orders: {
    id: number;
    document_number: string;
  } | null;
  profiles: {
    name: string;
    last_name: string;
  };
  out_warehouse: {
    id: number;
    name: string;
  };
  in_warehouse: {
    id: number;
    name: string;
  };
}

const Movements: React.FC = () => {
  const { user } = useAuth();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (user) {
      fetchMovements();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [movements, searchTerm, startDate, endDate]);

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .select(`
          *,
          variations!inner (
            id,
            sku,
            products!inner (
              id,
              title
            ),
            variation_terms (
              terms (
                id,
                name
              )
            )
          ),
          types!stock_movements_movement_type_fkey (
            id,
            name
          ),
          orders (
            id,
            document_number
          ),
          profiles!stock_movements_created_by_fkey (
            name,
            last_name
          ),
          out_warehouse:warehouses!stock_movements_out_warehouse_id_fkey (
            id,
            name
          ),
          in_warehouse:warehouses!stock_movements_in_warehouse_id_fkey (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching stock movements:', error);
        return;
      }

      setMovements(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...movements];

    // Filter by search term (product name or SKU)
    if (searchTerm) {
      filtered = filtered.filter(
        (movement) =>
          movement.variations.products.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          movement.variations.sku?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by date range
    if (startDate) {
      filtered = filtered.filter(
        (movement) => new Date(movement.created_at) >= new Date(startDate)
      );
    }

    if (endDate) {
      filtered = filtered.filter(
        (movement) => new Date(movement.created_at) <= new Date(endDate + 'T23:59:59')
      );
    }

    setFilteredMovements(filtered);
  };

  const getTotalMovements = () => filteredMovements.length;

  const getTotalOutflow = () => {
    return filteredMovements
      .filter((m) => m.order_id)
      .reduce((sum, m) => sum + m.quantity, 0);
  };

  const getTotalManualMovements = () => {
    return filteredMovements.filter((m) => !m.order_id).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando movimientos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Movimientos de Inventario</h1>
        <p className="text-muted-foreground">Historial completo de movimientos de stock</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Movimientos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTotalMovements()}</div>
            <p className="text-xs text-muted-foreground">Registros en el periodo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Salidas por Ventas</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTotalOutflow()}</div>
            <p className="text-xs text-muted-foreground">Unidades vendidas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Movimientos Manuales</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTotalManualMovements()}</div>
            <p className="text-xs text-muted-foreground">Ajustes manuales</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por producto o SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                placeholder="Fecha inicio"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                placeholder="Fecha fin"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {(searchTerm || startDate || endDate) && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                setSearchTerm('');
                setStartDate('');
                setEndDate('');
              }}
            >
              Limpiar filtros
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Movements Table */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Movimientos</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredMovements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron movimientos
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Variación</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Almacén</TableHead>
                    <TableHead>Origen</TableHead>
                    <TableHead>Usuario</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMovements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(movement.created_at), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="font-medium">
                        {movement.variations.products.title}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {movement.variations.variation_terms.map((vt) => (
                            <Badge key={vt.terms.id} variant="outline" className="text-xs">
                              {vt.terms.name}
                            </Badge>
                          ))}
                          {movement.variations.variation_terms.length === 0 && (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {movement.quantity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {movement.out_warehouse_id === movement.in_warehouse_id ? (
                            movement.out_warehouse.name
                          ) : (
                            <>
                              {movement.out_warehouse.name} → {movement.in_warehouse.name}
                            </>
                          )}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {movement.types.name}
                          {(movement.order_id || movement.return_id) && (
                            <> #{movement.order_id || movement.return_id}</>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {movement.profiles.name} {movement.profiles.last_name}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Movements;

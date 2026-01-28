
## Refactorización del Módulo de Ventas (Sales)

Este plan reorganiza el listado de ventas siguiendo la arquitectura en capas del proyecto, con la tabla integrada directamente en la página principal.

### Resumen de Cambios

1. Eliminar `Sales.tsx` (página placeholder actual)
2. Renombrar `SalesList.tsx` a `Sales.tsx` y refactorizar
3. Actualizar la ruta de `/sales/list` a `/sales`
4. Reorganizar siguiendo la estructura de capas
5. Crear Edge Function y RPC para el listado

---

### Estructura Final de Archivos

```text
src/modules/sales/
├── adapters/
│   ├── Sales.adapter.ts          (NUEVO)
│   └── Shipping.adapter.ts
├── components/
│   ├── sales/                    (NUEVO directorio)
│   │   ├── SalesHeader.tsx       (NUEVO)
│   │   ├── SalesFilterBar.tsx    (NUEVO)
│   │   └── SalesFilterModal.tsx  (NUEVO)
│   └── shipping/
├── hooks/
│   ├── useSales.ts               (NUEVO)
│   ├── useCreateSale.ts
│   └── useShipping.ts
├── pages/
│   ├── Sales.tsx                 (RENOMBRAR + refactor con tabla inline)
│   └── CreateSale.tsx
├── services/
│   ├── Sales.service.ts          (NUEVO)
│   └── Shipping.service.ts
├── types/
│   └── Sales.types.ts            (NUEVO)
└── routes.tsx                    (ACTUALIZAR)
```

---

### Paso 1: Crear Tipos (types/Sales.types.ts)

```typescript
export interface SaleListItem {
  id: number;
  date: string;
  documentNumber: string;
  customerName: string;
  customerLastname: string;
  saleTypeName: string;
  situationName: string;
  statusCode: string;
  total: number;
}

export interface SalesFilters {
  search: string;
  status: string;
  saleType: number | null;
  startDate: string;
  endDate: string;
  order: string;
}

export interface SalesApiResponse {
  page: { page: number; size: number; total: number };
  data: SaleListItemApi[];
}

export interface SalesPaginationState {
  p_page: number;
  p_size: number;
  total: number;
}
```

---

### Paso 2: Crear RPC en Base de Datos

**Función:** `sp_get_sales_list`

**Parámetros:**
- `p_page` (default 1)
- `p_size` (default 20)
- `p_search` (búsqueda por cliente/documento)
- `p_status` (filtro por código de estado)
- `p_sale_type` (filtro por tipo de venta)
- `p_start_date` / `p_end_date` (rango de fechas)
- `p_order` (ordenamiento: date_desc, date_asc, total_desc, total_asc)

**Retorno:**
```json
{
  "page": { "page": 1, "size": 20, "total": 100 },
  "data": [
    {
      "id": 1,
      "date": "2026-01-28",
      "document_number": "12345678",
      "customer_name": "Juan",
      "customer_lastname": "Pérez",
      "sale_type_name": "Tienda",
      "situation_name": "Confirmado",
      "status_code": "CFM",
      "total": 150.00
    }
  ]
}
```

---

### Paso 3: Crear Edge Function (get-sales-list/index.ts)

- Recibe query params del frontend
- Llama al RPC `sp_get_sales_list`
- Retorna respuesta JSON con CORS headers

---

### Paso 4: Crear Service (services/Sales.service.ts)

```typescript
export const fetchSalesList = async (filters: SalesFilters, pagination: SalesPaginationState): Promise<SalesApiResponse>
```

---

### Paso 5: Crear Adapter (adapters/Sales.adapter.ts)

```typescript
export const salesListAdapter = (response: SalesApiResponse) => ({
  sales: response.data.map(item => ({
    id: item.id,
    date: item.date,
    documentNumber: item.document_number,
    customerName: item.customer_name,
    customerLastname: item.customer_lastname,
    saleTypeName: item.sale_type_name,
    situationName: item.situation_name,
    statusCode: item.status_code,
    total: item.total,
  })),
  pagination: {
    p_page: response.page.page,
    p_size: response.page.size,
    total: response.page.total,
  }
})
```

---

### Paso 6: Crear Hook (hooks/useSales.ts)

Siguiendo el patrón de `useProducts.ts`:

**Estado:**
- `sales`: Lista de ventas
- `loading`: Estado de carga
- `pagination`: Paginación
- `filters`: Filtros activos
- `search`: Búsqueda
- `selectedSales`: Ventas seleccionadas
- `isOpenFilterModal`: Estado del modal

**Funciones:**
- `loadData()`: Carga datos via service + adapter
- `onSearchChange`, `onPageChange`, `onOrderChange`
- `handlePageSizeChange`
- `goToNewSale`, `goToSaleDetail`
- `toggleSelectAll`, `toggleSaleSelection`
- `onOpenFilterModal`, `onCloseFilterModal`, `onApplyFilter`

---

### Paso 7: Crear Componentes

**SalesHeader.tsx**
- Título "Gestión de Ventas"
- Subtítulo "Administra las ventas realizadas"
- Botón "Nueva Venta" (navega a `/sales/create`)
- Botón de eliminación masiva (si hay seleccionados)

**SalesFilterBar.tsx**
- Input de búsqueda con icono (width fijo 300px)
- Botón "Filtrar" para abrir modal
- Select de ordenamiento (fecha, total)

**SalesFilterModal.tsx**
- Filtros por rango de fecha (DatePicker)
- Filtro por estado/situación (Select)
- Filtro por tipo de venta/canal (Select)
- Botones Aplicar/Limpiar

---

### Paso 8: Crear Página Principal (pages/Sales.tsx)

La tabla estará integrada directamente en la página (no como componente separado):

```tsx
const Sales = () => {
  const {
    sales, loading, search, pagination, filters,
    selectedSales, isOpenFilterModal,
    handlePageSizeChange, toggleSelectAll, toggleSaleSelection,
    onOpenFilterModal, onCloseFilterModal, onApplyFilter,
    goToNewSale, goToSaleDetail,
    onPageChange, onSearchChange, onOrderChange,
  } = useSales();

  return (
    <div className="space-y-6">
      <SalesHeader
        selectedSales={selectedSales}
        handleNewSale={goToNewSale}
      />

      <Card>
        <CardHeader>
          <SalesFilterBar
            search={search}
            onSearchChange={onSearchChange}
            onOpen={onOpenFilterModal}
            order={filters.order}
            onOrderChange={onOrderChange}
          />
        </CardHeader>
        
        <CardContent className="p-0">
          {/* TABLA INLINE - No es componente separado */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedSales.length === sales.length && sales.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Cargando ventas...
                    </div>
                  </TableCell>
                </TableRow>
              ) : sales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                    {search ? "No se encontraron ventas" : "No hay ventas registradas"}
                  </TableCell>
                </TableRow>
              ) : (
                sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedSales.includes(sale.id)}
                        onCheckedChange={() => toggleSaleSelection(sale.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">#{sale.id}</TableCell>
                    <TableCell>{format(new Date(sale.date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>{sale.documentNumber}</TableCell>
                    <TableCell>{sale.customerName} {sale.customerLastname}</TableCell>
                    <TableCell>{sale.saleTypeName || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(sale.statusCode)}>
                        {sale.situationName}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      S/ {Number(sale.total).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex gap-2 justify-center">
                        <Button variant="outline" size="sm" onClick={() => goToSaleDetail(sale.id)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/sales/${sale.id}`)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>

        <CardFooter>
          <PaginationBar
            pagination={pagination}
            onPageChange={onPageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </CardFooter>
      </Card>

      <SalesFilterModal
        isOpen={isOpenFilterModal}
        filters={filters}
        onClose={onCloseFilterModal}
        onApply={onApplyFilter}
      />
    </div>
  );
};
```

---

### Paso 9: Actualizar Rutas (routes.tsx)

```typescript
import Sales from './pages/Sales';
import CreateSale from './pages/CreateSale';

export const salesRoutes: RouteObject[] = [
  { path: 'sales', element: <Sales /> },           // Antes: /sales/list
  { path: 'sales/create', element: <CreateSale /> },
  { path: 'sales/edit/:id', element: <CreateSale /> },
];
```

---

### Paso 10: Archivos a Eliminar

- `src/modules/sales/pages/SalesList.tsx` (contenido migrado a Sales.tsx)
- `src/modules/sales/pages/Sales.tsx` (placeholder original)

---

### Detalles Técnicos

#### RPC: sp_get_sales_list

```sql
CREATE OR REPLACE FUNCTION public.sp_get_sales_list(
  p_page integer DEFAULT 1,
  p_size integer DEFAULT 20,
  p_search text DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_sale_type integer DEFAULT NULL,
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL,
  p_order text DEFAULT 'date_desc'
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  result JSONB;
  v_offset INT := GREATEST((p_page - 1) * p_size, 0);
  v_search text := NULLIF(btrim(p_search), '');
BEGIN
  WITH filtered_orders AS (
    SELECT 
      o.id,
      o.date,
      o.document_number,
      o.customer_name,
      o.customer_lastname,
      st.name AS sale_type_name,
      sit.name AS situation_name,
      sta.code AS status_code,
      o.total
    FROM orders o
    LEFT JOIN sale_types st ON st.id = o.sale_type_id
    LEFT JOIN order_situations os ON os.order_id = o.id AND os.last_row = true
    LEFT JOIN situations sit ON sit.id = os.situation_id
    LEFT JOIN statuses sta ON sta.id = os.status_id
    WHERE 
      (v_search IS NULL OR 
        o.document_number ILIKE '%' || v_search || '%' OR
        o.customer_name ILIKE '%' || v_search || '%' OR
        o.customer_lastname ILIKE '%' || v_search || '%')
      AND (p_status IS NULL OR sta.code = p_status)
      AND (p_sale_type IS NULL OR o.sale_type_id = p_sale_type)
      AND (p_start_date IS NULL OR o.date >= p_start_date)
      AND (p_end_date IS NULL OR o.date <= p_end_date)
  )
  SELECT jsonb_build_object(
    'page', jsonb_build_object(
      'page', p_page,
      'size', p_size,
      'total', (SELECT COUNT(*) FROM filtered_orders)
    ),
    'data', COALESCE(
      (SELECT jsonb_agg(row_to_json(q.*) ORDER BY 
        CASE WHEN p_order = 'date_desc' THEN q.date END DESC,
        CASE WHEN p_order = 'date_asc' THEN q.date END ASC,
        CASE WHEN p_order = 'total_desc' THEN q.total END DESC,
        CASE WHEN p_order = 'total_asc' THEN q.total END ASC
      )
      FROM (SELECT * FROM filtered_orders LIMIT p_size OFFSET v_offset) q),
      '[]'::jsonb
    )
  ) INTO result;
  
  RETURN result;
END;
$$;
```

#### Edge Function: get-sales-list/index.ts

```typescript
import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const url = new URL(req.url);
    const params = {
      p_page: parseInt(url.searchParams.get('page') || '1'),
      p_size: parseInt(url.searchParams.get('size') || '20'),
      p_search: url.searchParams.get('search') || null,
      p_status: url.searchParams.get('status') || null,
      p_sale_type: url.searchParams.get('sale_type') 
        ? parseInt(url.searchParams.get('sale_type')!) 
        : null,
      p_start_date: url.searchParams.get('start_date') || null,
      p_end_date: url.searchParams.get('end_date') || null,
      p_order: url.searchParams.get('order') || 'date_desc',
    };

    const { data, error } = await supabase.rpc('sp_get_sales_list', params);
    
    if (error) throw error;

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

---

### Orden de Implementación

1. Crear tipos en `types/Sales.types.ts`
2. Crear migración SQL para el RPC `sp_get_sales_list`
3. Crear Edge Function `get-sales-list`
4. Crear service `Sales.service.ts`
5. Crear adapter `Sales.adapter.ts`
6. Crear hook `useSales.ts`
7. Crear componentes (SalesHeader, SalesFilterBar, SalesFilterModal)
8. Crear página principal `Sales.tsx` con tabla inline
9. Actualizar rutas en `routes.tsx`
10. Eliminar archivos obsoletos



## Plan: Filtrar productos por almacén seleccionado en Crear Venta

### Resumen
Actualmente, al buscar productos en la pantalla de crear venta, el stock que se muestra es la suma de todos los almacenes. El usuario necesita que el stock mostrado sea únicamente del almacén seleccionado en el modal inicial (y que se mantiene en el campo "Almacén" de la sección "Información de la Venta").

---

### Cambios a implementar

#### 1. Modificar Edge Function `get-sale-products`

**Archivo:** `supabase/functions/get-sale-products/index.ts`

Agregar un nuevo parámetro `p_warehouse_id` que se pasará al RPC:

```typescript
const p_warehouse_id = url.searchParams.get("p_warehouse_id") 
  ? parseInt(url.searchParams.get("p_warehouse_id")!) 
  : null;

const { data, error } = await supabase.rpc("sp_get_sale_products", {
  p_page,
  p_size,
  p_search,
  p_stock_type_id,
  p_warehouse_id,  // Nuevo parámetro
});
```

---

#### 2. Modificar el servicio `fetchSaleProducts`

**Archivo:** `src/modules/sales/services/index.ts`

Agregar `warehouseId` a la interfaz de parámetros y al query string:

```typescript
export interface FetchSaleProductsParams {
  page?: number;
  size?: number;
  search?: string;
  stockTypeId?: number;
  warehouseId?: number;  // Nuevo
}

// En la función:
if (params.warehouseId)
  queryParams.set("p_warehouse_id", String(params.warehouseId));
```

---

#### 3. Modificar la función `loadProducts`

**Archivo:** `src/modules/sales/hooks/useCreateSale.ts`

Agregar el parámetro `warehouseId` a la función y pasarlo al servicio:

```typescript
const loadProducts = async (
  page: number,
  search: string,
  stockTypeId?: number,
  warehouseId?: number,  // Nuevo
) => {
  // ...
  const result = await fetchSaleProducts({
    page,
    size: 10,
    search: search || undefined,
    stockTypeId,
    warehouseId,  // Pasarlo al servicio
  });
  // ...
};
```

---

#### 4. Actualizar todas las llamadas a `loadProducts`

Hay 4 lugares donde se llama a `loadProducts`:

1. **useEffect inicial (línea ~166)**:
   ```typescript
   loadProducts(1, "", undefined, userWarehouseId || undefined);
   ```
   
2. **useEffect de debounce (línea ~197)**:
   ```typescript
   loadProducts(
     1,
     searchQuery,
     selectedStockTypeId ? parseInt(selectedStockTypeId) : undefined,
     userWarehouseId || undefined,
   );
   ```

3. **handleProductPageChange (línea ~385)**:
   ```typescript
   loadProducts(
     newPage,
     searchQuery,
     selectedStockTypeId ? parseInt(selectedStockTypeId) : undefined,
     userWarehouseId || undefined,
   );
   ```

4. **Llamada inicial**: Debe esperar a que `userWarehouseId` esté cargado antes de cargar productos.

---

#### 5. Ajustar dependencias del useEffect

El useEffect de debounce debe incluir `userWarehouseId` en sus dependencias para recargar cuando cambie:

```typescript
useEffect(() => {
  // No cargar si no hay warehouse asignado aún
  if (!userWarehouseId) return;
  
  if (searchDebounceRef.current) {
    clearTimeout(searchDebounceRef.current);
  }
  searchDebounceRef.current = setTimeout(() => {
    setProductPage(1);
    loadProducts(
      1,
      searchQuery,
      selectedStockTypeId ? parseInt(selectedStockTypeId) : undefined,
      userWarehouseId,
    );
  }, 300);

  return () => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
  };
}, [searchQuery, selectedStockTypeId, userWarehouseId]);
```

---

#### 6. Modificar el RPC `sp_get_sale_products` en la base de datos

El stored procedure debe ser modificado para aceptar y usar el nuevo parámetro `p_warehouse_id`.

La lógica de filtrado de stock debe cambiar de:
- Suma de stock en todos los almacenes
  
A:
- Stock solo del almacén especificado (si se proporciona)

---

### Flujo de datos actualizado

```text
Usuario selecciona almacén en modal
         ↓
userWarehouseId se guarda en estado
         ↓
Usuario busca productos
         ↓
loadProducts(page, search, stockTypeId, warehouseId)
         ↓
fetchSaleProducts({ ..., warehouseId })
         ↓
GET /get-sale-products?...&p_warehouse_id=X
         ↓
RPC sp_get_sale_products(p_warehouse_id)
         ↓
Devuelve stock filtrado por almacén
```

---

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/get-sale-products/index.ts` | Agregar parámetro `p_warehouse_id` |
| `src/modules/sales/services/index.ts` | Agregar `warehouseId` a interfaz y query params |
| `src/modules/sales/hooks/useCreateSale.ts` | Modificar `loadProducts` y sus llamadas |
| **Base de datos (RPC)** | Modificar `sp_get_sale_products` para filtrar por almacén |

---

### Sección técnica

#### Dependencia crítica: Modificación del RPC

El RPC `sp_get_sale_products` debe ser modificado para aceptar el parámetro `p_warehouse_id`. La consulta de stock dentro del RPC actualmente hace algo como:

```sql
SELECT SUM(stock) FROM product_stock WHERE product_variation_id = ...
```

Debe cambiar a:

```sql
SELECT stock FROM product_stock 
WHERE product_variation_id = ... 
  AND warehouse_id = p_warehouse_id
  AND (p_stock_type_id IS NULL OR stock_type_id = p_stock_type_id)
```

Esta modificación requiere acceso a la base de datos para alterar la función.


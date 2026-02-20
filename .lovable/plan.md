
## Plan: Mostrar stock virtual y selector de tipo de inventario en el paso de productos del POS

### Contexto actual

- El RPC `sp_get_sale_products` **ya usa** la vista `vw_product_stock_virtual` para mostrar el stock virtual. Esto ya esta funcionando correctamente.
- El hook `usePOS` ya maneja `selectedStockTypeId` y `setSelectedStockTypeId`, y los tipos de stock estan disponibles en `formData.stockTypes`.
- Sin embargo, el componente `ProductsStep` **no recibe ni muestra** un selector de tipo de inventario. El tipo se fija automaticamente al inicializar y el usuario no puede cambiarlo en el paso 2.

### Cambios a realizar

**1. Actualizar `ProductsStep.tsx`** para:
- Recibir nuevas props: `stockTypes` (lista de tipos disponibles), `selectedStockTypeId` y `onStockTypeChange`.
- Agregar un selector (`Select`) junto a la barra de busqueda que permita elegir el tipo de inventario (ej: Produccion, Fallado, etc.).
- Agregar una etiqueta visual que indique que el stock mostrado es "Stock Virtual".

**2. Actualizar `POS.tsx`** para:
- Pasar las nuevas props al componente `ProductsStep`: los tipos de stock desde `pos.formData?.stockTypes`, el tipo seleccionado (`pos.selectedStockTypeId`) y la funcion para cambiarlo (`pos.setSelectedStockTypeId`).

### Detalle tecnico

**`ProductsStep.tsx`** - Nuevas props:
```text
stockTypes: Array<{ id: number; name: string }>
selectedStockTypeId: string
onStockTypeChange: (value: string) => void
```

Se agregara un componente `Select` de shadcn al lado de la barra de busqueda para elegir el tipo de inventario. Al cambiar el tipo, se recargaran los productos automaticamente (el hook ya escucha cambios en `selectedStockTypeId` via useEffect).

En la columna "Stock" de la tabla de productos, se mostrara la etiqueta "Stock Virtual" en el encabezado para dejar claro que es el stock disponible considerando reservas.

**`POS.tsx`** - Solo agregar 3 props adicionales al componente `ProductsStep`:
```text
stockTypes={pos.formData?.stockTypes || []}
selectedStockTypeId={pos.selectedStockTypeId}
onStockTypeChange={pos.setSelectedStockTypeId}
```

No se requieren cambios en el backend, la edge function ni el RPC ya que todo funciona correctamente con `vw_product_stock_virtual`.

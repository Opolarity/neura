

## Plan: Mostrar spinner de carga en tabla de productos durante filtros/paginación

### Problema
En `ProductsTable.tsx`, el spinner solo aparece cuando `loading && products.length === 0`. Al cambiar filtros, orden o página, ya hay productos cargados así que el spinner no se muestra.

### Solución
Agregar un overlay de carga (similar al `PageLoader` del proyecto) sobre la tabla cuando `loading` es `true` y ya hay productos. La tabla seguirá visible de fondo pero con el spinner superpuesto.

### Cambio en `src/modules/products/components/products/ProductsTable.tsx`

Envolver el `<Table>` en un `div` con `position: relative`, y cuando `loading && products.length > 0`, renderizar un overlay absoluto con el spinner `Loader2` encima de la tabla existente. Esto mantiene el comportamiento actual para carga inicial (tabla vacía + spinner centrado) y agrega el overlay para recarga de datos.

### Archivos a modificar
- `src/modules/products/components/products/ProductsTable.tsx` — agregar overlay de loading


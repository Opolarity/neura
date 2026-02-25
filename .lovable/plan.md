

## Plan: Cambiar la URL de edición de productos a `/products/edit`

### Problema
Cuando se edita un producto, la URL es `/products/add?id=110`. Debería ser `/products/edit?id=110`.

### Cambios necesarios

1. **`src/modules/products/products.routes.tsx`** — Agregar nueva ruta `edit` que apunte al mismo componente `AddProduct`.

2. **`src/app/App.tsx`** (línea ~88) — Agregar ruta `products/edit` con el mismo componente `AddProduct`.

3. **`src/modules/products/store/Products.logic.ts`** (línea 166) — Cambiar `navigate("/products/add?id=${productId}")` a `navigate("/products/edit?id=${productId}")`.

4. **`src/modules/products/hooks/useProducts.ts`** (línea 109) — Cambiar `navigate("/products/add?id=${id}")` a `navigate("/products/edit?id=${id}")`.

La ruta `/products/add` se mantiene para crear productos nuevos (sin `?id=`).


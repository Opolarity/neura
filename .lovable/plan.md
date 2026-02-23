
## Reglas de Precios por Cantidad

### Enfoque
Crear una unica funcion `applyPriceRules` que reciba el array de items del carrito, internamente tenga la logica con ifs/condicionales hardcodeados, y retorne el array con los precios ya modificados. Se necesita un campo `originalPrice` para poder revertir precios cuando ya no aplique la regla.

### Cambios

**1. Nuevo archivo: `src/modules/sales/rules/applyPriceRules.ts`**

Funcion pura que recibe items genericos del carrito (con `variationId`, `quantity`, `price`, `originalPrice`) y retorna el array con precios mutados.

```typescript
interface CartItemForRules {
  variationId: number;
  quantity: number;
  price: number;
  originalPrice: number;
  [key: string]: any; // preservar campos adicionales
}

export function applyPriceRules<T extends CartItemForRules>(items: T[]): T[] {
  return items.map((item) => {
    let newPrice = item.originalPrice; // siempre partir del precio original

    // --- REGLA 1: Ejemplo placeholder ---
    // if (item.variationId === 42 && item.quantity >= 3) {
    //   newPrice = item.originalPrice * 0.9; // 10% descuento
    // }

    // --- REGLA 2: Ejemplo por total de items en carrito ---
    // const totalUnits = items.reduce((sum, i) => sum + i.quantity, 0);
    // if (totalUnits >= 10) {
    //   newPrice = item.originalPrice * 0.95; // 5% descuento general
    // }

    return { ...item, price: newPrice };
  });
}
```

La funcion siempre parte de `originalPrice` para recalcular, asi si la cantidad baja del umbral, el precio vuelve al original automaticamente.

**2. Modificar tipos: `src/modules/sales/types/index.ts`**

Agregar `originalPrice` a `SaleProduct`:

```typescript
export interface SaleProduct {
  // ... campos existentes ...
  originalPrice: number; // precio original antes de reglas
}
```

**3. Modificar tipos: `src/modules/sales/types/POS.types.ts`**

Agregar `originalPrice` a `POSCartItem`:

```typescript
export interface POSCartItem {
  // ... campos existentes ...
  originalPrice: number;
}
```

**4. Modificar: `src/modules/sales/hooks/useCreateSale.ts`**

- Al agregar producto (`addProduct`): guardar el precio en ambos campos `price` y `originalPrice`
- Agregar un `useEffect` que observe `products` y ejecute `applyPriceRules`, actualizando el estado solo si los precios cambiaron (para evitar loops infinitos)

```typescript
useEffect(() => {
  if (products.length === 0) return;
  const updated = applyPriceRules(products);
  // Solo actualizar si hubo cambio real en precios
  const changed = updated.some((u, i) => u.price !== products[i].price);
  if (changed) setProducts(updated);
}, [products]);
```

**5. Modificar: `src/modules/sales/hooks/usePOS.ts`**

- Al agregar producto (`addToCart`): guardar precio en `price` y `originalPrice`
- Al incrementar cantidad (existente en carrito): no tocar `originalPrice`
- Mismo `useEffect` que en useCreateSale para aplicar reglas

### Flujo

```text
Usuario agrega/modifica producto en carrito
        |
        v
setProducts / setCart (con originalPrice preservado)
        |
        v
useEffect detecta cambio en items
        |
        v
applyPriceRules(items) -- evalua ifs internos
        |
        v
Si algun precio cambio -> actualiza estado
        |
        v
UI muestra precios ya con reglas aplicadas
```

### Notas
- Las reglas se agregan editando los ifs dentro de `applyPriceRules`
- La funcion recibe TODO el carrito, asi puede hacer logica cruzada entre productos (ej: "si tienes A y B juntos, descuento en B")
- El precio con regla aplicada es el que se persiste en `order_products` al crear la venta

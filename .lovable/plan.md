

## Plan: Permitir productos con stock cero para movimientos tipo MER

### Cambios en `src/modules/inventory/hooks/useCreateMovements.ts`

**1. `onSelectProduct` (línea 165)**
- Cambiar la condición `if (product.stock === 0)` para que solo bloquee si el tipo de movimiento NO es `MER`
- Si `movementType?.code === "MER"`, permitir seleccionar productos con stock 0

**2. `normalizeQuantity` (líneas 57-70)**
- Agregar un parámetro opcional `isMER: boolean` (o similar) para que cuando sea tipo MER, no aplique el `Math.min(value, stock)` y permita cualquier cantidad positiva

**3. `handleQuantitySelectedProduct` (línea 86)**
- Pasar el flag de MER a `normalizeQuantity` para que no limite la cantidad al stock disponible cuando el tipo es MER

### Resumen de cambios
- Solo se modifica 1 archivo: `useCreateMovements.ts`
- 3 puntos de cambio dentro del archivo


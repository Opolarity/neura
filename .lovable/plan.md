
## Reglas de Precios por Cantidad

### Enfoque
La lógica de reglas de precios vive en una Edge Function de Supabase (`apply-price-rules`). El frontend envía los items del carrito y recibe los items con precios ya modificados. Se preserva un campo `originalPrice` para poder revertir precios cuando ya no aplique la regla.

### Arquitectura

```text
Frontend (useEffect en hooks)
        |
        v
POST /apply-price-rules  { items: [...] }
        |
        v
Edge Function evalúa reglas hardcodeadas
        |
        v
Retorna { items: [...] } con precios mutados
        |
        v
Frontend actualiza estado si hubo cambios
```

### Archivos

| Archivo | Rol |
|---|---|
| `supabase/functions/apply-price-rules/index.ts` | Edge Function con la lógica de reglas |
| `src/modules/sales/rules/applyPriceRules.ts` | Cliente que llama a la edge function |
| `src/modules/sales/types/index.ts` | `SaleProduct` con `originalPrice` |
| `src/modules/sales/types/POS.types.ts` | `POSCartItem` con `originalPrice` |
| `src/modules/sales/hooks/useCreateSale.ts` | useEffect que aplica reglas al cambiar productos |
| `src/modules/sales/hooks/usePOS.ts` | useEffect que aplica reglas al cambiar carrito |
| `src/modules/sales/adapters/index.ts` | `originalPrice` en adaptSaleById |

### Notas
- Las reglas se agregan editando los ifs dentro de `applyPriceRules()` en la Edge Function
- La Edge Function recibe TODO el carrito para lógica cruzada entre productos
- Si la Edge Function falla, el frontend usa los precios originales (fallback)
- El precio con regla aplicada es el que se persiste en `order_products` al crear la venta

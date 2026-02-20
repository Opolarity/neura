
## Plan: Mostrar nombre de metodo de pago en pagos ya agregados

### Problema
Cuando se edita una venta, los pagos ya registrados buscan el nombre del metodo de pago en `filteredPaymentMethods` (que solo contiene los metodos del canal de venta actual y activos). Si el metodo de pago original no pertenece al canal actual o esta inactivo, aparece "Metodo" en vez del nombre real.

### Solucion
Exponer la lista completa de metodos de pago (`salesData.paymentMethods`) desde el hook y usarla exclusivamente para mostrar nombres de pagos ya agregados. Los selectores para agregar nuevos pagos seguiran usando `filteredPaymentMethods`.

### Cambios por archivo

**1. `src/modules/sales/hooks/useCreateSale.ts`**
- Agregar `allPaymentMethods` al return del hook, con valor `salesData?.paymentMethods ?? []`

**2. `src/modules/sales/pages/CreateSale.tsx`**
- Extraer `allPaymentMethods` del hook
- En la seccion "Pagos Registrados" (linea ~1164): cambiar `filteredPaymentMethods.find(...)` por `allPaymentMethods.find(...)` para resolver el nombre del metodo
- En la seccion "Vueltos registrados" (linea ~1351): mismo cambio, usar `allPaymentMethods.find(...)` en vez de `filteredPaymentMethods.find(...)`
- Los `Select` para agregar nuevos pagos/vueltos siguen usando `filteredPaymentMethods` sin cambios

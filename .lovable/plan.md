

## Plan: Logica de asignacion de business_account_id en pagos POS

### Resumen
Implementar la logica para que cada pago en el POS envie correctamente el `business_account_id` segun tres reglas:
1. Si el metodo de pago tiene `business_account_id != 0` -> usar ese automaticamente
2. Si tiene `business_account_id == 0` y su `code != "CASH"` -> mostrar un select de cuentas destino
3. Si el metodo de pago tiene `code == "CASH"` -> usar el `business_account_id` de la sesion POS (caja vinculada al canal de venta)

---

### Cambios por archivo

#### 1. `src/shared/services/service.ts`
- Modificar `getActivePaymentMethodsBySaleTypeId` para incluir la columna `code` en el select de `payment_methods`
- Cambiar el select de: `id, name, business_account_id, active, is_active` a: `id, name, business_account_id, active, is_active, code`

#### 2. `src/modules/sales/types/index.ts`
- Agregar `code` al interface `PaymentMethod`:
  ```
  code?: string | null;
  ```

#### 3. `src/modules/sales/types/POS.types.ts`
- Agregar `businessAccountId` al interface `POSPayment`:
  ```
  businessAccountId?: string;
  ```

#### 4. `src/modules/sales/hooks/usePOS.ts`
- En `setFilteredPaymentMethods`, mapear tambien `code` desde la respuesta del servicio
- En la funcion `addPayment`, determinar el `businessAccountId` segun las 3 reglas:
  - Buscar el metodo seleccionado en `filteredPaymentMethods`
  - Si `method.businessAccountId != 0` -> asignar ese valor
  - Si `method.code == "CASH"` -> asignar `POSSessionHook.session.businessAccountId`
  - Si `method.businessAccountId == 0` y `code != "CASH"` -> tomar del campo `currentPayment.businessAccountId` (seleccionado por el usuario en el UI)
- Cargar lista de business accounts activas para el select (usar `getBusinessAccountIsActiveTrue` ya existente)
- En `submitOrder`, pasar `businessAccountId` en cada payment al `CreatePOSOrderRequest`

#### 5. `src/modules/sales/components/pos/steps/PaymentStep.tsx`
- Recibir nueva prop `businessAccounts` (lista de cuentas activas)
- Cuando el usuario selecciona un metodo de pago con `business_account_id == 0` y `code != "CASH"`, mostrar un `Select` adicional de "Cuenta de destino" con las cuentas disponibles
- Pasar el valor seleccionado via `onUpdateCurrentPayment("businessAccountId", value)`

#### 6. `src/modules/sales/services/POS.service.ts`
- En `createPOSOrder`, agregar `business_account_id` al mapeo de payments que se envia al edge function:
  ```
  business_account_id: p.businessAccountId || null
  ```

#### 7. `src/modules/sales/types/POS.types.ts` (CreatePOSOrderRequest)
- Agregar `businessAccountId` al tipo de payment en `CreatePOSOrderRequest.payments[]`

---

### Flujo de datos

```text
Usuario selecciona metodo de pago
        |
        v
  business_account_id del metodo?
        |
   +---------+---------+
   |         |         |
  != 0    == 0       == 0
   |     code=CASH   code!=CASH
   |         |         |
  Auto    Session    Mostrar
  assign  account    Select UI
   |         |         |
   v         v         v
  business_account_id guardado en POSPayment
        |
        v
  Enviado al edge function create-order
        |
        v
  Guardado en order_payment.business_acount_id
```


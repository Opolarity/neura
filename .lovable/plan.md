

# Plan: Mostrar selector de Business Account cuando el metodo de pago tiene business_account_id = 0

## Resumen

Cuando se selecciona un metodo de pago cuyo `business_account_id` es `0` (como "Credito", "Debito", "Efectivo", "Transferencia bancaria"), se mostrara un campo adicional para que el usuario seleccione manualmente a cual cuenta de negocio (business account) asignar el pago. Si el metodo de pago ya tiene un `business_account_id` diferente de `0`, ese valor se usara automaticamente sin mostrar el campo extra.

## Cambios necesarios

### 1. Edge Function `get-sales-form-data`
- Modificar la consulta de `payment_methods` para incluir el campo `business_account_id` en la respuesta (actualmente solo trae `id` y `name`).
- Agregar una nueva consulta para traer los `business_accounts` activos (id, name, bank) para poblar el dropdown.

### 2. Tipos (`src/modules/sales/types/index.ts`)
- Agregar `businessAccountId` al tipo `PaymentMethod` (actualmente solo tiene `id` y `name`).
- Agregar `businessAccountId` al tipo `SalePayment` como campo opcional.
- Agregar tipo `BusinessAccountOption` con `id`, `name`, `bank`.
- Agregar `businessAccounts` al tipo `SalesFormDataResponse`.

### 3. Adaptador (`src/modules/sales/adapters/index.ts`)
- Actualizar `adaptPaymentMethods` para incluir `businessAccountId`.
- Agregar adaptador para `businessAccounts`.
- Actualizar `adaptSalesFormData` para incluir `businessAccounts`.

### 4. Hook (`src/modules/sales/hooks/useCreateSale.ts`)
- Agregar campo `businessAccountId` al `createEmptyPayment()`.
- En `handlePaymentChange`, cuando se cambia `paymentMethodId`, verificar si el metodo seleccionado tiene `businessAccountId === 0`. Si no es 0, auto-asignar ese valor. Si es 0, limpiar para que el usuario seleccione.
- En `addPayment`, validar que si el metodo tiene `businessAccountId === 0`, el usuario haya seleccionado una cuenta.
- Al enviar los pagos en `handleSubmit`, incluir `business_account_id` en cada pago.

### 5. Pagina (`src/modules/sales/pages/CreateSale.tsx`)
- En la seccion de pagos, despues del selector de metodo de pago, agregar condicionalmente un `Select` de "Cuenta de destino" que solo aparece cuando el metodo de pago seleccionado tiene `businessAccountId === 0`.

### 6. Servicio (`src/modules/sales/services/index.ts`)
- Incluir `business_account_id` en el mapeo de pagos tanto en `createOrder` como en `updateOrder`.

### 7. Edge Function `create-order`
- Pasar `business_account_id` del pago al stored procedure en el array de pagos.

### 8. Stored Procedure `sp_create_order`
- Modificar para usar el `business_account_id` del pago cuando viene en el JSON (override), y solo hacer fallback a `payment_methods.business_account_id` cuando no viene o es null.
- Agregar `business_acount_id` al INSERT de `order_payment`.

### 9. Edge Function `update-order`
- Usar el `business_account_id` del pago cuando viene en el input, sino caer al valor del payment_method.
- Agregar `business_acount_id` al INSERT de `order_payment`.

## Seccion Tecnica

### Flujo de datos

```text
UI (Select Business Account)
  -> SalePayment.businessAccountId
    -> createOrder/updateOrder service (business_account_id in payment)
      -> Edge Function (pass through)
        -> SP / direct insert
          -> order_payment.business_acount_id
          -> movements.business_account_id
```

### Logica condicional en UI

```text
SI payment_method.business_account_id === 0:
  Mostrar Select "Cuenta de destino" con business_accounts activos
  Guardar seleccion en currentPayment.businessAccountId
  Validar antes de agregar pago
SINO:
  No mostrar campo extra
  Usar payment_method.business_account_id automaticamente
```

### Migracion SQL necesaria

Actualizar `sp_create_order` para:
1. Leer `business_account_id` del JSON de cada pago
2. Usarlo como override cuando esta presente y es distinto de null/0
3. Insertarlo en `order_payment.business_acount_id` (nota: la columna tiene typo "acount")


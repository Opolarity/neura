

## Guardar apellidos correctamente en orders y accounts

### Resumen
Actualmente `customer_lastname` en la tabla `orders` solo guarda el apellido paterno. Se necesita que guarde ambos apellidos (paterno + materno) juntos separados por un espacio. Al crear el account (cuando el cliente no existe), se debe guardar apellido paterno en `last_name` y apellido materno en `last_name2`.

### Cambios necesarios

#### 1. Frontend - Servicio `src/modules/sales/services/index.ts`
- En `createOrder`: enviar un nuevo campo `customer_lastname2` (ya se envia) para que el edge function lo use al crear el account.
- Cambiar `customer_lastname` para que concatene ambos apellidos: `customerLastname + " " + customerLastname2`.

#### 2. Frontend - Servicio `src/modules/sales/services/index.ts` (updateOrder)
- Mismo cambio: `customer_lastname` debe enviar la concatenacion de ambos apellidos.

#### 3. Edge Function `create-order/index.ts`
- Pasar `customer_lastname2` como campo separado dentro de `p_order_data` para que el RPC lo use al crear el account.
- El campo `customer_lastname` ya llegara concatenado para guardarse en la tabla `orders`.

#### 4. Migracion SQL - Modificar `sp_create_order`
- En el INSERT a `accounts` (STEP 0), cambiar:
  - `last_name` = `p_order_data->>'customer_lastname_first'` (apellido paterno solamente)
  - `last_name2` = `p_order_data->>'customer_lastname2'` (apellido materno)
- Se enviara un campo adicional `customer_lastname_first` con solo el apellido paterno para uso exclusivo del account.

#### 5. Adapter `src/modules/sales/adapters/index.ts` - `adaptSaleById`
- Al cargar una orden para edicion, `customer_lastname` contiene ambos apellidos juntos. Se debe separar: tomar la primera palabra como `customerLastname` y el resto como `customerLastname2`.

### Detalle tecnico

**En `src/modules/sales/services/index.ts` (createOrder y updateOrder):**
```typescript
// Concatenar apellidos para orders.customer_lastname
const fullLastname = [orderData.customerLastname, orderData.customerLastname2]
  .filter(Boolean)
  .join(" ");

// Enviar al edge function
customer_lastname: fullLastname,
customer_lastname_first: orderData.customerLastname,  // solo paterno, para accounts
customer_lastname2: orderData.customerLastname2,       // solo materno, para accounts
```

**En `create-order/index.ts`:**
```typescript
// Pasar customer_lastname_first y customer_lastname2 en p_order_data
// customer_lastname ya viene concatenado para la tabla orders
```

**Migracion SQL (sp_create_order):**
```sql
-- En el INSERT a accounts, usar los campos separados
INSERT INTO accounts (document_type_id, document_number, name, last_name, last_name2, ...)
VALUES (
  ...,
  p_order_data->>'customer_name',
  p_order_data->>'customer_lastname_first',  -- solo paterno
  p_order_data->>'customer_lastname2',       -- solo materno
  ...
);
```

**En `adaptSaleById`:**
```typescript
// Separar customer_lastname en paterno y materno
const fullLastname = data.order.customer_lastname || "";
const lastnameParts = fullLastname.split(" ");
const customerLastname = lastnameParts[0] || "";
const customerLastname2 = lastnameParts.slice(1).join(" ") || "";
```

### Archivos a modificar
- `src/modules/sales/services/index.ts` - concatenar apellidos al enviar
- `supabase/functions/create-order/index.ts` - pasar campos separados al RPC
- `supabase/functions/update-order/index.ts` - concatenar apellidos en el UPDATE a orders
- Migracion SQL para actualizar `sp_create_order` - usar campos separados para accounts
- `src/modules/sales/adapters/index.ts` - separar apellidos al cargar orden

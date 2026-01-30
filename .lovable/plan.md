
## Plan: Corregir POS para vincular órdenes con sesión y arreglar errores de build

### Resumen del problema

El módulo POS tiene varios problemas:

1. **Problema principal**: Las órdenes creadas desde el POS no se vinculan con la sesión activa en la tabla `pos_session_orders`. Esto significa que al cerrar la caja, no se calculan correctamente las ventas.

2. **Errores de tipos**: El componente POSHeader importa `CashSession` pero el tipo se llama `POSSession`.

3. **Errores de build**: Hay imports duplicados en `service.ts` y props faltantes en otros componentes.

---

### Cambios a implementar

#### 1. Modificar el flujo de creación de orden para vincular con sesión POS

**Opción elegida**: Después de crear la orden exitosamente, insertar un registro en `pos_session_orders`.

**Archivo**: `src/modules/sales/hooks/usePOS.ts`

En la función `submitOrder`, después de recibir el `order_id` del resultado:

```typescript
const result = await createPOSOrder(orderData);

// Vincular orden con sesión POS
if (result.order?.id && POSSessionHook.session?.id) {
  await supabase.from("pos_session_orders").insert({
    pos_session_id: POSSessionHook.session.id,
    order_id: result.order.id,
  });
}
```

---

#### 2. Corregir tipos de POS

**Archivo**: `src/modules/sales/types/POS.types.ts`

Agregar el alias de tipo y el campo userName:

```typescript
// Agregar userName a POSSession
export interface POSSession {
  // ... campos existentes ...
  userName?: string;  // Nuevo campo
}

// Alias para compatibilidad
export type CashSession = POSSession;
```

**Archivo**: `src/modules/sales/adapters/POS.adapter.ts`

Modificar el adaptador para incluir userName (si está disponible):

```typescript
export const adaptPOSSession = (apiResponse: POSSessionApiResponse): POSSession => {
  return {
    // ... campos existentes ...
    userName: apiResponse.user_name ?? null,
  };
};
```

---

#### 3. Modificar Edge Function para devolver datos de usuario

**Archivo**: `supabase/functions/manage-pos-session/index.ts`

En la acción `get-active`, incluir el nombre del usuario en la respuesta:

```typescript
if (action === "get-active") {
  const { data, error } = await supabase
    .from("pos_sessions")
    .select(`
      *,
      status:statusses(*),
      user:profiles!pos_sessions_user_id_fkey(
        account:accounts(name, last_name)
      )
    `)
    // ...
```

---

#### 4. Corregir errores de build

**Archivo**: `src/shared/services/service.ts`

Corregir import duplicado:
```typescript
// ANTES (incorrecto)
import { Status, Status, Type, Types } from "@/types/index.ts";

// DESPUÉS (correcto)
import { Status, Type } from "@/types/index.ts";
```

**Archivo**: `src/modules/sales/components/pos/POSHeader.tsx`

Cambiar import:
```typescript
// ANTES
import type { CashSession } from "../../types/POS.types";

// DESPUÉS
import type { POSSession } from "../../types/POS.types";

// O mantener CashSession si se agrega como alias
```

**Archivo**: `src/modules/settings/pages/BranchesList.tsx`

Agregar el prop faltante o hacerlo opcional en el FilterBar.

---

### Flujo corregido

```text
Usuario en POS → Completa venta → Clic en "Finalizar"
         ↓
submitOrder() en usePOS.ts
         ↓
createPOSOrder() → create-order edge function
         ↓
sp_create_order RPC → Retorna order_id
         ↓
INSERT INTO pos_session_orders (pos_session_id, order_id)  ← NUEVO
         ↓
Toast de éxito + Reset para nueva venta
```

---

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/modules/sales/hooks/usePOS.ts` | Agregar INSERT a pos_session_orders después de crear orden |
| `src/modules/sales/types/POS.types.ts` | Agregar userName y alias CashSession |
| `src/modules/sales/adapters/POS.adapter.ts` | Adaptar userName del API response |
| `supabase/functions/manage-pos-session/index.ts` | Incluir datos de usuario en get-active |
| `src/shared/services/service.ts` | Corregir imports duplicados |
| `src/modules/sales/components/pos/POSHeader.tsx` | Corregir import de tipo |
| `src/modules/settings/pages/BranchesList.tsx` | Corregir prop faltante |
| `src/modules/settings/components/branches/BranchesFilterBar.tsx` | Hacer onOpen opcional |

---

### Sección técnica: RLS para pos_session_orders

La tabla `pos_session_orders` no tiene políticas RLS configuradas. Se necesitará agregar políticas para permitir inserts:

```sql
-- Permitir a usuarios autenticados insertar vínculos de sus propias órdenes
CREATE POLICY "Users can link their orders to POS sessions"
ON pos_session_orders FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM pos_sessions ps
    WHERE ps.id = pos_session_orders.pos_session_id
    AND ps.user_id = auth.uid()
  )
);

-- Permitir lectura para calcular totales
CREATE POLICY "Users can view their session orders"
ON pos_session_orders FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM pos_sessions ps
    WHERE ps.id = pos_session_orders.pos_session_id
    AND ps.user_id = auth.uid()
  )
);
```

---

### Dependencias

1. Primero: Agregar RLS a `pos_session_orders`
2. Segundo: Modificar tipos y adaptadores
3. Tercero: Modificar usePOS.ts para vincular órdenes
4. Cuarto: Corregir errores de build restantes

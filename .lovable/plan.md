
# Análisis: Página "Crear Venta" - Flujo de Datos y Arquitectura

## Resumen Ejecutivo

Después de revisar el código, he identificado los siguientes puntos clave:

---

## 1. Edge Functions Relacionadas con Ventas

| Edge Function | Ubicación | Estado |
|---------------|-----------|--------|
| `create-order` | `supabase/functions/create-order/` | Existe con errores de tipado |
| `update-order` | NO EXISTE | **FALTA - Crítico** |
| `get-sales-form-data` | `supabase/functions/get-sales-form-data/` | Existe con error de tipado |
| `get-sale-products` | `supabase/functions/get-sale-products/` | Existe con error de tipado |

---

## 2. Errores de Build a Corregir (Solo ventas)

| Archivo | Línea | Error |
|---------|-------|-------|
| `create-order/index.ts` | 17 | `supabaseUrl` puede ser undefined |
| `create-order/index.ts` | 219 | `error` es de tipo unknown |
| `get-sales-form-data/index.ts` | 147 | `error` es de tipo unknown |
| `get-sale-products/index.ts` | 50 | `error` es de tipo unknown |

---

## 3. Flujo Actual de Datos

```text
┌─────────────────────────────────────────────────────────────────────┐
│                      Frontend (useCreateSale.ts)                    │
│  handleSubmit() construye orderData con:                            │
│    • Datos del cliente (documentType, name, email, phone...)        │
│    • Productos [{variationId, quantity, price, discountAmount}]     │
│    • Pagos [{paymentMethodId, amount, date, voucherUrl...}]         │
│    • initialSituationId                                             │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  Service (services/index.ts)                        │
│  createOrder(orderData) → invoke("create-order")                    │
│  updateOrder(id, orderData) → invoke("update-order") ← NO EXISTE    │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│            Edge Function (create-order/index.ts)                    │
│  1. INSERT orders                                                   │
│  2. FOR EACH producto:                                              │
│     ├── INSERT stock_movements                                      │
│     ├── INSERT order_products                                       │
│     └── UPDATE product_stock                                        │
│  3. FOR EACH pago:                                                  │
│     ├── INSERT movements (financiero)                               │
│     └── INSERT order_payment                                        │
│  4. INSERT order_situations                                         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Respuesta a tu Pregunta: ¿Edge Function + RPC Transaccional?

### Situación Actual (Sin Transacción)
El código actual en `create-order` hace **múltiples inserciones independientes**:
- Si falla al insertar `order_products`, la orden ya fue creada
- Si falla al crear `stock_movements`, los productos quedan sin movimiento
- Si falla al actualizar `product_stock`, el inventario queda inconsistente

### Recomendación: SÍ usar RPC Transaccional

**Ventajas de usar un RPC (`sp_create_order`):**
1. **Atomicidad**: Todo se inserta o nada se inserta
2. **Consistencia**: No hay estados intermedios corruptos
3. **Rendimiento**: Una sola llamada al servidor en lugar de múltiples
4. **Mantenibilidad**: Lógica centralizada en la base de datos
5. **Seguridad**: Menor superficie de ataque

**Arquitectura Propuesta:**
```text
Frontend → Edge Function (validación + orquestación) → RPC (transacción atómica)
```

El Edge Function debería:
- Validar JWT y obtener user_id
- Preparar los datos
- Llamar al RPC `sp_create_order` que hace TODO dentro de una transacción

---

## 5. Plan de Corrección

### Fase 1: Corregir Errores de Build (Inmediato)

**Archivo: `supabase/functions/create-order/index.ts`**
```typescript
// Línea 15-17: Validar variables de entorno
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}
const supabase = createClient(supabaseUrl, supabaseKey);

// Línea 219: Tipar el error
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  return new Response(JSON.stringify({
    error: "Internal server error",
    details: errorMessage
  }), ...);
}
```

**Archivo: `supabase/functions/get-sales-form-data/index.ts`**
```typescript
// Línea 147: Tipar el error
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  return new Response(JSON.stringify({ error: errorMessage }), ...);
}
```

**Archivo: `supabase/functions/get-sale-products/index.ts`**
```typescript
// Línea 50: Tipar el error
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  return new Response(JSON.stringify({ error: errorMessage }), ...);
}
```

### Fase 2: Crear `update-order` Edge Function

Crear `supabase/functions/update-order/index.ts` con la misma lógica de `create-order` pero para actualizaciones:
- Debe revertir movimientos de stock anteriores
- Eliminar productos y pagos anteriores
- Insertar nuevos productos y pagos
- Registrar nuevos movimientos de stock

### Fase 3 (Recomendada - Futuro): Migrar a RPC Transaccional

Crear un RPC `sp_create_order` que maneje todo transaccionalmente:

```sql
CREATE OR REPLACE FUNCTION sp_create_order(
  p_user_id UUID,
  p_order_data JSONB,
  p_products JSONB,
  p_payments JSONB
) RETURNS JSONB AS $$
DECLARE
  v_order_id BIGINT;
  v_product JSONB;
  v_payment JSONB;
BEGIN
  -- Todo dentro de una transacción automática
  
  -- 1. Insertar orden
  INSERT INTO orders (...) VALUES (...) RETURNING id INTO v_order_id;
  
  -- 2. Insertar productos y movimientos
  FOR v_product IN SELECT * FROM jsonb_array_elements(p_products) LOOP
    -- INSERT stock_movements
    -- INSERT order_products
    -- UPDATE product_stock
  END LOOP;
  
  -- 3. Insertar pagos
  FOR v_payment IN SELECT * FROM jsonb_array_elements(p_payments) LOOP
    -- INSERT movements
    -- INSERT order_payment
  END LOOP;
  
  -- Si cualquier cosa falla, toda la transacción se revierte
  RETURN jsonb_build_object('order_id', v_order_id, 'success', true);
END;
$$ LANGUAGE plpgsql;
```

---

## 6. Archivos a Modificar

| Archivo | Acción |
|---------|--------|
| `supabase/functions/create-order/index.ts` | Corregir errores de tipado |
| `supabase/functions/get-sales-form-data/index.ts` | Corregir error de tipado |
| `supabase/functions/get-sale-products/index.ts` | Corregir error de tipado |
| `supabase/functions/update-order/index.ts` | **CREAR** (nueva función) |
| `supabase/config.toml` | Agregar configuración de `update-order` |

---

## Conclusión

1. **Prioridad Inmediata**: Corregir los 4 errores de build en las edge functions de ventas
2. **Prioridad Alta**: Crear la edge function `update-order` que actualmente no existe
3. **Recomendación a Futuro**: Migrar a un modelo transaccional con RPC para garantizar integridad de datos

El enfoque actual funciona pero tiene riesgo de inconsistencia. Para un sistema de ventas, la integridad transaccional es crítica porque involucra inventario y dinero.



## Bug: `sale_type` no se obtiene correctamente desde la sesión POS

### Causa raíz

El `sale_type_id` ya existe en la tabla `pos_sessions`, pero:

1. **El tipo `POSSessionApiResponse`** no incluye `sale_type_id`
2. **El adapter `adaptPOSSession`** no lo mapea
3. **El tipo `POSSession`** no tiene la propiedad `saleTypeId`
4. **`usePOS.ts`** hace una query indirecta a `sale_types` buscando por `business_acount_id` para derivar el `sale_type_id`, en vez de leerlo directamente de la sesión

Cuando la sesión ya estaba abierta y no se pasó por el paso de selección de canal de venta, esa query indirecta puede fallar o devolver null, causando que `sessionSaleTypeId` quede en null y se envíe `"1"` como fallback.

### Corrección

**1. Agregar `sale_type_id` al tipo y adapter de sesión POS**

- `POSSessionApiResponse`: agregar `sale_type_id: number`
- `POSSession`: agregar `saleTypeId: number`
- `adaptPOSSession`: mapear `sale_type_id → saleTypeId`

**2. En `usePOS.ts`, usar directamente `POSSessionHook.session.saleTypeId`**

- Inicializar `sessionSaleTypeId` desde la sesión: `setSessionSaleTypeId(POSSessionHook.session.saleTypeId)`
- Eliminar la query indirecta a `sale_types` que busca por `business_acount_id` (mantener solo la carga de métodos de pago usando el `saleTypeId` directo)
- Eliminar el fallback `|| "1"` y `|| 1` ya que siempre se tendrá el valor real desde la sesión

**3. Verificar que `getActivePOSSession` trae `sale_type_id`**

- Confirmar que el servicio de sesión activa (`POSSession.service.ts`) incluye `sale_type_id` en su SELECT

### Flujo corregido
```text
Sesión POS abierta (tiene sale_type_id en DB) →
adaptPOSSession mapea sale_type_id → saleTypeId →
usePOS lee session.saleTypeId directamente →
Se pasa al crear orden sin depender de queries adicionales
```


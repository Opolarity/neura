
## Plan: Boton "Venta Anonima" en el paso 3 del POS

### Que se hara

Agregar un boton "Venta Anonima" en la barra de navegacion inferior (donde estan "Volver" y "Continuar Venta") que aparezca **solo en el paso 3** (Datos del Cliente). Al hacer clic, el sistema aplicara la misma logica de compra anonima que ya existe en el modulo de ventas (`sales/add`):

1. Buscar en la tabla `accounts` el registro anonimo (`document_type_id = 0`, `document_number = " "`)
2. Rellenar el nombre del cliente con el nombre de esa cuenta (ej: "No especificado")
3. Marcar la venta como anonima
4. Avanzar automaticamente al siguiente paso

### Cambios por archivo

**1. `src/modules/sales/hooks/usePOS.ts`**
- Agregar estado `isAnonymousPurchase` (boolean, default false)
- Crear funcion `handleAnonymousPurchase` que:
  - Consulta la cuenta anonima en `accounts` (document_type_id=0, document_number=" ")
  - Actualiza los datos del cliente con el nombre obtenido, limpia documento/apellidos
  - Marca `isExistingClient = true`
  - Marca `isAnonymousPurchase = true`
  - Avanza al paso siguiente automaticamente
- Modificar `submitOrder` para enviar `documentType: "0"`, `documentNumber: " "`, apellidos como `null` cuando `isAnonymousPurchase` es true
- Limpiar `isAnonymousPurchase` en `resetForNewSale` y `resetAll`
- Ajustar `canProceedToStep` para el paso 4: si es compra anonima, no requerir documentTypeId ni documentNumber
- Exponer `isAnonymousPurchase` y `handleAnonymousPurchase` en el return

**2. `src/modules/sales/components/pos/POSWizardNavigation.tsx`**
- Agregar props: `onAnonymousPurchase?: () => void`
- Renderizar un boton "Venta Anonima" (con icono `UserX`) en el grupo derecho de botones, solo cuando `onAnonymousPurchase` este definido

**3. `src/modules/sales/pages/POS.tsx`**
- Pasar `onAnonymousPurchase` al componente `POSWizardNavigation`, pero solo cuando el paso actual sea 3:
  ```
  onAnonymousPurchase={pos.currentStep === 3 ? pos.handleAnonymousPurchase : undefined}
  ```

### Detalle tecnico de la logica anonima

La funcion `handleAnonymousPurchase` replica exactamente lo que hace `handleAnonymousToggle` en `useCreateSale.ts`:

```text
1. Consultar supabase: accounts donde document_type_id=0, document_number=" "
2. Obtener nombre completo del registro anonimo
3. Actualizar customer: customerName = nombre anonimo, documentTypeId = "", documentNumber = "", apellidos = ""
4. Marcar isExistingClient = true en customer
5. isAnonymousPurchase = true
6. Avanzar al paso 4 (o 5 si no requiere envio)
```

En `submitOrder`, cuando `isAnonymousPurchase = true`:
- `documentType` se envia como `"0"` (en vez del campo del formulario)
- `documentNumber` se envia como `" "` (espacio)
- `customerLastname` y `customerLastname2` se envian como `null`
- `isExistingClient` se envia como `true`

Esto asegura que el RPC `sp_create_order` reutilice la cuenta anonima existente sin crear duplicados.


# Plan: Agregar Checkbox "Compra Anónima" en Crear Venta

## Resumen
Se agregará un checkbox "Compra anónima" al lado del checkbox "Requiere Envío" en la sección "Información de la Venta". Al activarlo, se bloquearán y vaciarán los campos de datos del cliente, y al crear la venta se enviará internamente tipo de documento = 0 y número de documento = "0".

---

## Cambios en la Interfaz

### Ubicación del nuevo checkbox
El checkbox se agregará en la línea 813-829 del archivo `CreateSale.tsx`, dentro del contenedor `<div className="flex items-center space-x-4 pt-2">` que ya contiene el checkbox "Requiere Envío".

### Comportamiento visual
- **Checkbox desactivado**: Los campos funcionan normalmente
- **Checkbox activado**: 
  - Los campos Tipo Doc., Número, Nombre, Apellido Paterno y Apellido Materno se deshabilitan
  - Los campos se muestran vacíos con estilo `bg-muted`
  - Los valores se limpian automáticamente

---

## Archivos a Modificar

### 1. `src/modules/sales/types/index.ts`
- Agregar campo `isAnonymousPurchase: boolean` a la interfaz `SaleFormData`

### 2. `src/modules/sales/hooks/useCreateSale.ts`
- Agregar `isAnonymousPurchase: false` al `INITIAL_FORM_DATA`
- Modificar `handleInputChange` para limpiar campos del cliente cuando se activa compra anónima
- Modificar `handleSubmit` para enviar `documentType: "0"` y `documentNumber: "0"` cuando es compra anónima
- Exponer `isAnonymousPurchase` desde el hook (ya está disponible via `formData.isAnonymousPurchase`)

### 3. `src/modules/sales/pages/CreateSale.tsx`
- Agregar checkbox "Compra anónima" junto a "Requiere Envío"
- Deshabilitar campos del cliente cuando `formData.isAnonymousPurchase` es `true`
- Aplicar estilo `bg-muted` a los campos deshabilitados

---

## Detalles Técnicos

### Nuevo campo en SaleFormData
```typescript
export interface SaleFormData {
  // ... campos existentes
  isAnonymousPurchase: boolean; // Nuevo campo
}
```

### Lógica al activar "Compra anónima"
Cuando se cambia `isAnonymousPurchase` a `true`:
1. Limpiar `documentType`, `documentNumber`, `customerName`, `customerLastname`, `customerLastname2`
2. Resetear `clientFound` a `null`

### Lógica al enviar la venta
En `handleSubmit`, antes de construir `orderData`:
```typescript
const finalDocumentType = formData.isAnonymousPurchase ? "0" : formData.documentType;
const finalDocumentNumber = formData.isAnonymousPurchase ? "0" : formData.documentNumber;
```

### UI del checkbox
```tsx
<div className="flex items-center space-x-2">
  <Checkbox
    id="anonymousPurchase"
    checked={formData.isAnonymousPurchase}
    onCheckedChange={(checked) =>
      handleInputChange("isAnonymousPurchase", checked as boolean)
    }
  />
  <Label htmlFor="anonymousPurchase" className="cursor-pointer font-medium">
    Compra Anónima
  </Label>
</div>
```

### Campos a deshabilitar
Los siguientes campos se deshabilitarán cuando `isAnonymousPurchase === true`:
- Select "Tipo Doc." (línea 691-708)
- Input "Número" (línea 713-718)
- Input "Nombre" / "Razón Social" (línea 749-756)
- Input "Apellido Paterno" (línea 789-796)
- Input "Apellido Materno" (línea 800-807)

Condición combinada de deshabilitado:
```typescript
disabled={formData.isAnonymousPurchase || clientFound === true}
```

---

## Consideraciones

1. **Edición de ventas**: Si se edita una venta anónima, el checkbox debe reflejar el estado (verificar si `documentType === "0"`)
2. **Validación**: No se requiere validación de campos de cliente si es compra anónima
3. **Backend**: No requiere cambios - ya acepta `document_type: 0` y `document_number: "0"`


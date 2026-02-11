

## Checkbox "Compra Anonima" junto a "Requiere Envio"

### Resumen
Se agregara un nuevo checkbox "Compra anónima" al lado del checkbox "Requiere Envio". Al activarlo, los campos de cliente (tipo de documento, numero de documento, nombre, apellido paterno y materno) se limpiaran y deshabilitaran. Al crear o actualizar la orden, se enviara `document_type = "0"`, `document_number = " "` (espacio en blanco), y los campos de nombre/apellidos como `null`.

### Cambios

#### 1. Hook `useCreateSale.ts`
- Agregar estado `isAnonymousPurchase` (boolean, default `false`) y su setter `setIsAnonymousPurchase`.
- Crear un handler `handleAnonymousToggle` que al activarse:
  - Limpie `documentType`, `documentNumber`, `customerName`, `customerLastname`, `customerLastname2` del `formData`.
  - Resetee `clientFound` a `false`.
- En `handleSubmit`, cuando `isAnonymousPurchase` sea `true`, sobreescribir los campos del `orderData`:
  - `documentType: "0"`
  - `documentNumber: " "` (un espacio)
  - `customerName: null`
  - `customerLastname: null`
  - `customerLastname2: null`
- Exponer `isAnonymousPurchase` y `setIsAnonymousPurchase` / `handleAnonymousToggle` en el return del hook.
- Al cargar una orden existente (modo edicion), detectar si la orden tiene `document_type = 0` y `document_number = " "` para inicializar `isAnonymousPurchase = true`.

#### 2. Pagina `CreateSale.tsx`
- Junto al checkbox "Requiere Envio" (linea ~820-836), agregar un segundo checkbox "Compra anonima".
- Cuando `isAnonymousPurchase` sea `true`, deshabilitar y aplicar estilos `opacity-50 pointer-events-none` a los campos de:
  - Tipo de documento (Select)
  - Numero de documento (Input)
  - Nombre (Input)
  - Apellido paterno (Input)
  - Apellido materno (Input)

### Detalles tecnicos

**En `useCreateSale.ts`:**
```typescript
const [isAnonymousPurchase, setIsAnonymousPurchase] = useState(false);

const handleAnonymousToggle = useCallback((checked: boolean) => {
  setIsAnonymousPurchase(checked);
  if (checked) {
    setFormData(prev => ({
      ...prev,
      documentType: "",
      documentNumber: "",
      customerName: "",
      customerLastname: "",
      customerLastname2: "",
    }));
    setClientFound(false);
  }
}, []);
```

**En handleSubmit, antes de enviar:**
```typescript
const orderData = {
  documentType: isAnonymousPurchase ? "0" : formData.documentType,
  documentNumber: isAnonymousPurchase ? " " : formData.documentNumber,
  customerName: isAnonymousPurchase ? null : formData.customerName,
  customerLastname: isAnonymousPurchase ? null : formData.customerLastname,
  customerLastname2: isAnonymousPurchase ? null : (formData.customerLastname2 || null),
  // ... resto igual
};
```

**En `CreateSale.tsx`:**
```tsx
<div className="flex items-center space-x-4 pt-2">
  <div className="flex items-center space-x-2">
    <Checkbox id="withShipping" ... />
    <Label htmlFor="withShipping">Requiere Envio</Label>
  </div>
  <div className="flex items-center space-x-2">
    <Checkbox
      id="anonymousPurchase"
      checked={isAnonymousPurchase}
      onCheckedChange={handleAnonymousToggle}
    />
    <Label htmlFor="anonymousPurchase" className="cursor-pointer font-medium">
      Compra anonima
    </Label>
  </div>
</div>
```

Los campos de cliente tendran la condicion `disabled={isAnonymousPurchase || clientFound}` para que se bloqueen cuando la compra es anonima.


## Plan: Prevenir duplicados y resaltar productos existentes en Crear Venta

### Resumen
Cuando el usuario intente agregar un producto que ya está en la tabla de productos agregados (misma variación Y mismo tipo de inventario), el sistema no lo agregará nuevamente. En su lugar, mostrará una notificación y resaltará temporalmente la fila del producto existente.

Si el usuario selecciona el mismo producto pero con un tipo de inventario diferente, se permitirá agregarlo como una nueva fila.

---

### Cambios a implementar

#### 1. Agregar estado para el resaltado de filas

Se agregará un estado en el componente `CreateSale.tsx` para rastrear qué índice de fila debe resaltarse temporalmente.

#### 2. Modificar la función `addProduct` en `useCreateSale.ts`

**Lógica actual:**
- Valida que haya una variación seleccionada
- Valida que haya un tipo de inventario seleccionado
- Valida que haya stock disponible
- Agrega el producto directamente

**Nueva lógica:**
- Antes de agregar, verificar si ya existe un producto con el mismo `variationId` Y `stockTypeId`
- Si existe: retornar el índice del producto existente (en lugar de agregar)
- Si no existe: agregar normalmente

La función retornará un objeto con información sobre si se agregó o si ya existía:
```typescript
{ added: true } | { added: false, existingIndex: number }
```

#### 3. Manejar el resaltado en `CreateSale.tsx`

- Capturar el resultado de `addProduct()`
- Si ya existía, activar el estado de resaltado con el índice correspondiente
- Aplicar una clase CSS de animación a la fila
- Después de la animación (ej: 1.5s), limpiar el estado

#### 4. Estilos de animación

Agregar estilos CSS para el efecto de resaltado (flash amarillo/dorado que desaparece gradualmente).

---

### Detalles técnicos

**Archivo: `src/modules/sales/hooks/useCreateSale.ts`**

Modificar `addProduct` para:
```typescript
const addProduct = useCallback((): { added: boolean; existingIndex?: number } => {
  // ... validaciones existentes ...
  
  // Nueva validación de duplicados
  const existingIndex = products.findIndex(
    (p) => p.variationId === selectedVariation.id && 
           p.stockTypeId === parseInt(selectedStockTypeId)
  );
  
  if (existingIndex !== -1) {
    // Ya existe con el mismo tipo de inventario
    toast({
      title: "Producto ya agregado",
      description: "Este producto ya está en la lista con el mismo tipo de inventario",
    });
    return { added: false, existingIndex };
  }
  
  // Agregar normalmente...
  return { added: true };
}, [selectedVariation, formData.priceListId, selectedStockTypeId, products, toast]);
```

**Archivo: `src/modules/sales/pages/CreateSale.tsx`**

1. Agregar estado:
```typescript
const [highlightedRowIndex, setHighlightedRowIndex] = useState<number | null>(null);
```

2. Modificar el onClick del botón Agregar:
```typescript
onClick={() => {
  const result = addProduct();
  if (!result.added && result.existingIndex !== undefined) {
    setHighlightedRowIndex(result.existingIndex);
    setTimeout(() => setHighlightedRowIndex(null), 1500);
  }
}}
```

3. Agregar clase condicional a TableRow:
```typescript
<TableRow 
  key={index}
  className={cn(
    highlightedRowIndex === index && "animate-highlight-row"
  )}
>
```

**Archivo: `src/index.css` o `src/App.css`**

Agregar animación:
```css
@keyframes highlight-flash {
  0% { background-color: rgb(234 179 8 / 0.5); }
  100% { background-color: transparent; }
}

.animate-highlight-row {
  animation: highlight-flash 1.5s ease-out;
}
```

---

### Comportamiento esperado

| Escenario | Resultado |
|-----------|-----------|
| Agregar producto nuevo | Se agrega normalmente |
| Agregar mismo producto + mismo tipo inventario | No se agrega, se muestra toast, se resalta fila existente |
| Agregar mismo producto + diferente tipo inventario | Se agrega como nueva fila |

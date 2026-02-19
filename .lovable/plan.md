## Plan: Boton "Emitir en SUNAT" en la pagina de edicion de comprobantes

### Objetivo

Agregar un boton "Emitir en SUNAT" en la pagina de edicion de comprobantes (`/invoices/edit/:id`) que envie los datos del comprobante a la API de NubeFact para su emision electronica ante SUNAT. La comunicacion con NubeFact se hara desde una Edge Function para proteger las credenciales (url y token del proveedor).

### Flujo general

```text
[Boton "Emitir en SUNAT"] 
    --> Edge Function "emit-invoice" (POST)
        --> Lee invoice + invoice_items de la BD
        --> Busca la serie en invoice_series para obtener invoice_provider_id
        --> Lee url y token del invoice_provider vinculado
        --> Construye el JSON segun formato NubeFact
        --> Envia POST a la URL del proveedor con el token en Authorization
        --> Guarda respuesta (pdf_url, xml_url, cdr_url, declared) en invoices
        --> Retorna resultado al frontend
    --> Muestra toast de exito/error
```

### Cambios a realizar

**1. Nueva Edge Function: `supabase/functions/emit-invoice/index.ts**`

- Recibe `{ invoice_id: number }` por POST
- Consulta la tabla `invoices` para obtener los datos del comprobante
- Consulta `invoice_items` para obtener los items
- Extrae el prefijo de serie del `tax_serie` (ej: "FPP1" de "FPP1-123") y busca en `invoice_series` para encontrar el `invoice_provider_id`
- Consulta `invoice_providers` para obtener `url` y `token`
- Mapea los datos al formato JSON de NubeFact:
  - `operacion`: "generar_comprobante"
  - `tipo_de_comprobante`: mapeado desde el `code` del tipo de factura (1=Factura, 2=Boleta, 3=NC, 4=ND)
  - `serie`: prefijo de tax_serie (ej: "FPP1")
  - `numero`: sufijo numerico de tax_serie (ej: 123)
  - `cliente_tipo_de_documento`: mapeado desde document_types.code (DNI->1, RUC->6, CE->4, PAS->7)
  - `cliente_numero_de_documento`, `cliente_denominacion`, `cliente_direccion`, `cliente_email`
  - `fecha_de_emision`: formato DD-MM-YYYY
  - Totales: `total_gravada`, `total_igv`, `total`
  - `items[]`: cada item con `unidad_de_medida`, `descripcion`, `cantidad`, `valor_unitario` (sin IGV), `precio_unitario` (con IGV), `subtotal`, `tipo_de_igv` (1=Gravado), `igv`, `total`
  - `enviar_automaticamente_a_la_sunat`: true
  - `enviar_automaticamente_al_cliente`: false (o true si tiene email)
- Envia POST a la URL del proveedor con header `Authorization: TOKEN` y `Content-Type: application/json`
- Al recibir respuesta exitosa, actualiza la tabla `invoices`:
  - `pdf_url` = `enlace_del_pdf`
  - `xml_url` = `enlace_del_xml`  
  - `cdr_url` = `enlace_del_cdr`
  - `declared` = `aceptada_por_sunat`
- Retorna la respuesta de NubeFact al frontend
- Seguridad: las credenciales (url, token) nunca se exponen al frontend, todo se maneja server-side

**2. Actualizar `supabase/config.toml**`

Agregar configuracion para la nueva funcion:

```toml
[functions.emit-invoice]
verify_jwt = false
```

**3. Modificar `src/modules/invoices/hooks/useCreateInvoice.ts**`

- Agregar funcion `handleEmit` que:
  - Llama a `supabase.functions.invoke("emit-invoice", { method: "POST", body: { invoice_id } })`
  - Muestra toast de exito con mensaje de SUNAT o toast de error
  - Recarga los datos del comprobante tras emision exitosa
- Exportar `handleEmit` y un estado `emitting` (boolean)

**4. Modificar `src/modules/invoices/pages/CreateInvoice.tsx**`

- Importar y usar `handleEmit` y `emitting` del hook
- Agregar boton "Emitir en SUNAT" visible solo cuando `isEditing` es true y `declared` es false
- El boton muestra un spinner mientras emite

### Seguridad

- El token y la URL del proveedor NUNCA se envian al frontend
- La Edge Function los lee directamente de la base de datos
- La Edge Function usa el JWT del usuario (patron con ANON_KEY + Authorization header) para respetar el contexto de autenticacion
- Se valida que el comprobante exista y no haya sido ya declarado antes de emitir

### Mapeo de tipos de documento (sistema -> NubeFact)

### Debe coger la columna "state_code" de la tabla document_types, ese es el codigo que sedebe enviar en el json de nubefact


| Sistema (code)          | NubeFact (segun columna state_code de document_types) |
| ----------------------- | ----------------------------------------------------- |
| DNI                     | 1                                                     |
| RUC                     | 6                                                     |
| CE                      | 4                                                     |
| PAS                     | 7                                                     |
| " " (espacio en blanco) | -                                                     |


### Mapeo de tipos de comprobante  
  
Debe coger la columna "code" de la tabla types, ese es el codigo que sedebe enviar en el json de nubefact


| types.code | NubeFact (segun columna code de types) |
| ---------- | -------------------------------------- |
| 1          | 1 (Factura)                            |
| 2          | 2 (Boleta)                             |
| 3          | 3 (Nota de credito)                    |
| 4          | 4 (Nota de debito)                     |

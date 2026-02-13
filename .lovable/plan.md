
## Galería de Medios - Plan Actualizado

### Resumen
Crear un módulo completo de galería de medios que permita subir, visualizar y gestionar fotos y videos. Los archivos se almacenarán en el bucket "ecommerce" bajo la carpeta "medios/", y los metadatos se guardarán en la tabla existente `visual_edits_medios`.

**Actualización importante**: La tabla `visual_edits_medios` ya existe en la base de datos, por lo que solo necesitamos implementar la interfaz y la lógica. La ruta será `/medios` (no `/ecommerce/media`).

---

### 1. Estructura de Archivos a Crear

Se crearán los siguientes archivos dentro de `src/modules/ecommerce/`:

**Types:**
- `types/medios.types.ts` - Tipos TypeScript para el medio (id, name, url, mimetype, created_at, created_by)

**Services:**
- `services/medios.service.ts` - Funciones para:
  - `uploadMedio()`: sube el archivo al bucket `ecommerce/medios/{uuid}-{filename}` e inserta el registro en `visual_edits_medios`
  - `getMedios()`: obtiene la lista de medios del usuario autenticado
  - `deleteMedio()`: elimina el registro y el archivo del storage

**Hooks:**
- `hooks/useMedios.ts` - Hook con estado de carga, lista de medios, y funciones de subida/eliminación

**Components:**
- `components/MediaDropzone.tsx` - Componente de arrastrar y soltar (drag & drop) que acepta imagenes (`image/*`) y videos (`video/*`)
- `components/MediaGrid.tsx` - Grilla responsive que muestra los medios subidos como tarjetas con miniatura
- `components/MediaDetailDialog.tsx` - Dialog que al hacer clic en un medio muestra su previsualizacion, URL publica y opciones

**Pages:**
- `pages/MediaGalleryPage.tsx` - Página principal que compone header, dropzone y grilla

**Routing:**
- `ecommerce.routes.ts` - Define la ruta `/medios` como ruta principal del módulo

---

### 2. Configuración de la Ruta

La nueva ruta `/medios` se registrará en `src/app/routes/index.tsx` importando `ecommerceRoutes`:

```typescript
import { ecommerceRoutes } from "@/modules/ecommerce";
```

Y agregándola en el array de rutas dentro del ProtectedLayout:

```typescript
...ecommerceRoutes,
```

---

### 3. Estructura de la Interfaz

**Dropzone:**
- Zona con borde punteado y fondo ligero
- Ícono de subida (upload from `lucide-react`)
- Texto: "Arrastra y suelta archivos aqui o haz clic para seleccionar"
- Acepta `image/*` y `video/*`
- Muestra progreso durante la subida

**Grilla de medios:**
- Cards responsive en grid (3-4 columnas en desktop, 2 en tablet, 1 en mobile)
- Cada tarjeta muestra:
  - Miniatura/preview (imagen renderizada, ícono de video para videos)
  - Nombre del archivo truncado
  - Fecha de creación formateada (DD/MM/YYYY)
  - Botón para eliminar (hover)
- Clic abre el MediaDetailDialog

**Dialog de Detalle:**
- Preview del medio (imagen renderizada o video con reproductor)
- Campo de texto con URL pública y botón "Copiar al portapapeles"
- Información: nombre, tipo MIME, fecha creada
- Botón para eliminar el medio con confirmación

---

### 4. Detalles Técnicos

**Upload y Storage:**
- Archivos se suben con: `supabase.storage.from('ecommerce').upload('medios/{uuid}-{filename}', file)`
- URL pública se obtiene con: `supabase.storage.from('ecommerce').getPublicUrl(path)`
- El nombre de archivo incluye UUID para garantizar unicidad

**Base de datos:**
- La tabla `visual_edits_medios` ya existe con columnas: id, name, url, mimetype, created_at, created_by
- El RLS debe permitir que usuarios autenticados vean/creen/eliminen solo sus propios medios

**Patrones del Proyecto:**
- Servicios en `services/` con funciones que usan `supabase` client
- Hooks en `hooks/` que manejan estado con `useState`/`useEffect` y usan React Query
- Componentes en `components/` usando componentes shadcn/ui (Card, Dialog, Button, etc.)
- Ícones de `lucide-react`

---

### 5. Archivo de Índice (index.ts)

Se actualizará o creará `src/modules/ecommerce/index.ts` para exportar:
- `ecommerceRoutes` desde las rutas
- Componentes principales si es necesario

---

### 6. Validación de RLS

Antes de implementar, se verificará que existan políticas RLS en `visual_edits_medios` que:
- Permitan a usuarios autenticados ver/crear sus propios medios
- Permitan a usuarios autenticados eliminar sus propios medios
- Usen `auth.uid() = created_by` como condición

Si no existen, se crearán en una migración SQL.

---

### Resumen de Archivos a Crear

```
src/modules/ecommerce/
├── types/
│   └── medios.types.ts (nuevo)
├── services/
│   └── medios.service.ts (nuevo)
├── hooks/
│   ├── useEcommerceSso.ts (existente)
│   └── useMedios.ts (nuevo)
├── components/
│   ├── MediaDropzone.tsx (nuevo)
│   ├── MediaGrid.tsx (nuevo)
│   └── MediaDetailDialog.tsx (nuevo)
├── pages/
│   └── MediaGalleryPage.tsx (nuevo)
├── ecommerce.routes.ts (nuevo)
└── index.ts (nuevo o actualizado)
```

**Archivos a Modificar:**
- `src/app/routes/index.tsx` - Agregar importación y registro de `ecommerceRoutes`



# Plan: Boton "Editar Ecommerce" con SSO Token

## Resumen
Agregar un boton "Editar Ecommerce" en el Header que genera un JWT SSO temporal (60s) en backend y redirige al ecommerce.

## 1. Secret: ECOMMERCE_SSO_SECRET
- Se necesita un secret para firmar el JWT con HS256.
- Se solicitara al usuario mediante la herramienta de secrets.
- Este secret debe ser el mismo que usa el proyecto Ecommerce para validar el token.

## 2. Edge Function: `generate-sso-token`
- Ruta: `supabase/functions/generate-sso-token/index.ts`
- Configuracion en `config.toml`: `verify_jwt = false`
- Validacion manual del JWT del usuario via `getClaims()`
- Genera un JWT HS256 con los campos:
  - `sub`: user ID del usuario autenticado
  - `role`: rol obtenido de la tabla `user_roles` / `roles`
  - `iss`: "neura"
  - `aud`: "ecommerce"
  - `exp`: now + 60 segundos
  - `jti`: UUID unico
- Retorna `{ token: "..." }` al frontend
- Usa `ECOMMERCE_SSO_SECRET` de Deno.env

## 3. Frontend (arquitectura por capas)

### 3a. Tipos: `src/modules/ecommerce/types/sso.types.ts`
```typescript
export interface SSOTokenResponse {
  token: string;
}
```

### 3b. Servicio: `src/modules/ecommerce/services/sso.service.ts`
- Llama a la edge function `generate-sso-token` usando `supabase.functions.invoke`
- Retorna el token

### 3c. Hook: `src/modules/ecommerce/hooks/useEcommerceSso.ts`
- Maneja estado `loading` y `error`
- Funcion `redirectToEcommerce()`:
  1. Llama al servicio
  2. Redirige a `https://localhost:3000/sso?token=JWT`
  3. Maneja errores con toast

### 3d. Header: `src/components/layout/Header.tsx`
- Agrega boton "Editar Ecommerce" a la izquierda del icono de notificaciones (Bell)
- Icono: `ExternalLink` de lucide-react
- Muestra spinner durante loading
- Usa el hook `useEcommerceSso`

## 4. Estructura de archivos nuevos

```text
src/modules/ecommerce/
  types/sso.types.ts
  services/sso.service.ts
  hooks/useEcommerceSso.ts

supabase/functions/generate-sso-token/
  index.ts
```

## Seccion Tecnica

### Edge Function - Pseudocodigo
```typescript
// 1. CORS headers
// 2. Validar auth con getClaims()
// 3. Consultar rol del usuario desde user_roles/roles
// 4. Firmar JWT HS256 con jose library (disponible en Deno)
// 5. Retornar { token }
```

### Dependencia Deno para JWT
Se usara `jose` importado desde `https://deno.land/x/jose/` o el modulo nativo de Deno para firmar HS256.

### URL de redireccion
Se usara `https://localhost:3000/sso?token=JWT` como URL base. Esta puede ser parametrizada despues como variable de entorno si se necesita.

### Flujo

```text
[Click boton] -> [Hook llama servicio] -> [Servicio invoca edge function]
-> [Edge function valida sesion, consulta rol, firma JWT]
-> [Retorna token] -> [Hook redirige con window.location.href]
```

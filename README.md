# Neura ERP

Frontend del ERP de Neura: panel de gestión empresarial construido con React + Vite. Consume el backend `neura-backend` (Supabase self-hosted: Auth, RPCs y edge functions) y comparte base de datos con el ecommerce (`ecommerce-overtake`).

## Stack

- React 18 + TypeScript
- Vite (`@vitejs/plugin-react-swc`)
- Tailwind CSS + shadcn/ui (Radix)
- Supabase JS (Auth, RPCs, Storage, edge functions)

## Requisitos

Node.js 20 y npm ([instalar con nvm](https://github.com/nvm-sh/nvm#installing-and-updating)).

## Puesta en marcha

```sh
npm ci
npm run dev
```

El servidor de desarrollo queda en `http://localhost:8080`.

### Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo con HMR (puerto 8080) |
| `npm run build` | Build de producción a `dist/` |
| `npm run build:dev` | Build en modo development |
| `npm run preview` | Sirve localmente el build de `dist/` |
| `npm run lint` | ESLint sobre todo el proyecto |

## Estructura del código

El código nuevo va en `src/modules/<dominio>/` (por dominio de negocio) o `src/shared/` (transversal). Las carpetas legacy en la raíz de `src/` (`components/`, `contexts/`, `hooks/`, `layouts/`, `types/`) se mantienen solo por compatibilidad; no agregar código nuevo ahí.

Flujo de datos dentro de un módulo:

```
Page → Hook → Service → Supabase
                 ↓
             Adapter → UI
```

Las pages no llaman a Supabase directamente: eso vive en `services/`, y la respuesta pasa por el `adapter` antes de llegar a la UI.

Alias de importación configurados en `vite.config.ts`: `@` (`src/`), `@app`, `@modules`, `@shared`.

### Convención para páginas con lógica compleja

Cuando una página tenga lógica compleja, sepárala en dos archivos: uno con el componente y sus bloques JSX/TSX, y otro que agrupe la lógica (funciones, hooks personalizados, handlers). No dividas el JSX entre múltiples archivos — importa la lógica desde el archivo dedicado y deja la presentación limpia.

## Entornos y ramas

| Entorno | Rama | URL |
|---------|------|-----|
| Producción | `main` | https://erp.neura.pe |
| Perception | `perception` | — |
| Desarrollo | `develop` | https://demo.neura.pe |

Se trabaja directamente sobre la rama del entorno; no se crean ramas feature. Los cambios de backend (migraciones, edge functions) van siempre en `neura-backend/supabase/`, nunca en este proyecto.

## Despliegue

Build multi-stage con Docker (ver [Dockerfile](Dockerfile)): compila con `npm ci && npm run build` sobre `node:20-alpine` y sirve `dist/` con nginx usando la config de [nginx.conf](nginx.conf) (fallback SPA a `index.html` y cache de assets estáticos).

```sh
docker build -t neura-erp .
docker run -p 8080:80 neura-erp
```

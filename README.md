# Pettii (App móvil)

Pettii es una app móvil construida con Expo + React Native para una comunidad de mascotas, con funcionalidades de:

- perfil y gestión de mascotas,
- feed social (posts, likes, comentarios, follow entre mascotas),
- catálogo de productos por veterinaria,
- carrito y pedidos,
- onboarding y autenticación.

La app usa Supabase para auth + base de datos + storage, React Query para estado de servidor y Zustand para estado local.

## Stack

- Expo / React Native
- expo-router (file-based routing)
- Supabase (`@supabase/supabase-js`)
- React Query (`@tanstack/react-query`)
- Zustand
- pnpm (gestor de paquetes)

## Estructura principal

- `src/app/`
  - navegación y pantallas
  - `src/app/_layout.tsx` (layout raíz)
  - `src/app/(drawer)/_layout.tsx` (drawer)
  - `src/app/(drawer)/(tabs)/_layout.tsx` (tabs)
  - tabs principales: Home / Shop / Social
- `src/features/`
  - módulos por dominio (`pets`, `posts`, `products`, `orders`, `clinics`)
  - cada módulo separa `api.ts` y `hooks.ts`
- `src/store/`
  - Zustand para auth, selección de mascota y carrito
- `src/providers/`
  - providers de app (React Query + bootstrap de auth/onboarding)
- `src/lib/`
  - clientes y utilidades transversales (Supabase, currency)

## Backend y datos

### Supabase

Cliente configurado en `src/lib/supabase.ts` con:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### Migraciones

- En este repo existe `supabase/` para configuración local.
- El esquema compartido principal (incluyendo social, productos, reportes y feed rankeado) se ha venido gestionando en `pettii_vet/supabase/migrations`.

## Flujos funcionales actuales

### 1) Auth + onboarding

- Login/register por email/password.
- Gate de onboarding antes de entrar al flujo principal.

### 2) Mascotas

- CRUD básico de mascotas.
- Ficha de salud (campos extendidos) y recordatorios.
- Selección de mascota activa en drawer (estado global).

### 3) Social

- Publicación de imagen/video (storage `pet_media`).
- Feed con likes, comentarios y follow entre mascotas.
- Perfil público de mascota con stats y galería.

### 4) Shop / pedidos

- Catálogo por clínica primaria del usuario.
- Filtros por categoría y chip especial `Promo`.
- Badges de producto (`Nuevo`, `Promo`, `Combo`, `Obsequio`).
- Modal de detalle de producto con `stock`.
- Carrito local + creación de pedido (cash on delivery).
- Formato de moneda centralizado en `src/lib/currency.ts`.

## Feed social: moderación, reportes y ranking

### Reportes de contenido (`post_reports`)

Se implementó flujo real de reportes de publicaciones:

- tabla `post_reports` con razones:
  - `spam`
  - `violence_abuse`
  - `misinformation`
  - `other`
- unicidad por `(post_id, reporter_user_id)` para evitar duplicados.
- botón `Reportar` en la UI del feed conectado a Supabase.

### Umbral automático de seguridad

Se agregó lógica de umbral por reportes:

- si un post acumula `>= 3` reportes `open`, se mueve a:
  - `moderation_status = 'pending'`
  - `moderation_reason = 'reported_by_users_threshold'`
- además se encola `moderation_jobs` para revisión.

Con esto, el contenido reportado puede salir del feed automáticamente mientras se revisa.

### Feed rankeado (`fetch_ranked_feed`)

Se reemplazó el feed cronológico simple por RPC rankeada:

- función SQL: `fetch_ranked_feed(p_follower_pet_id, p_limit, p_offset)`
- solo trae posts:
  - `visibility = 'public'`
  - `moderation_status = 'approved'`
- score inicial combina:
  - recencia,
  - engagement (likes + comentarios ponderados),
  - boost social (mascotas seguidas),
  - penalización por reportes abiertos.
- incluye límite por mascota para reducir repetición de autor.

### React Query y refresco

- al reportar, se invalida cache de feed (`posts/feed`) para refresco inmediato;
- al crear pedidos, se invalida cache de productos para actualizar stock en UI.

## Setup local

## Requisitos

- Node.js LTS
- pnpm
- Expo CLI (vía `pnpm` scripts)
- variables de entorno en `.env`

## Instalar

```bash
pnpm install
```

## Ejecutar

```bash
pnpm start
```

Atajos:

```bash
pnpm android
pnpm ios
pnpm web
```

## Lint

```bash
pnpm lint
```

## Variables de entorno

En `.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

## Notas para desarrollo

- Usar siempre `pnpm` (no `npm`).
- Seguir la organización por `features/*` para mantener APIs/hooks desacoplados.
- Mantener reglas críticas (moderación/reportes/ranking) en backend (migraciones/RPC), no en lógica cliente.
- Cuando se agreguen columnas o reglas de negocio de feed, documentarlas aquí y en migraciones.

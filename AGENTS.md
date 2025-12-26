# AGENTS.md

## Resumen del proyecto
Pettii es una app móvil hecha con Expo + React Native, usando `expo-router` para el enrutado por archivos y una UI con Drawer y Tabs. La lógica de datos se apoya en Supabase (auth, tablas y storage), con estado de servidor gestionado por React Query y estado local (auth/selección de mascota) con Zustand.

- Enrutado y navegación: `expo-router` con layout raíz, Drawer y Tabs en `src/app/_layout.tsx`, `src/app/(drawer)/_layout.tsx`, `src/app/(drawer)/(tabs)/_layout.tsx`.
- Pantallas principales: Home/Shop/Social en `src/app/(drawer)/(tabs)`, auth en `src/app/auth`, creación de mascota en `src/app/pet/create.tsx`.
- Backend: Supabase configurado en `src/lib/supabase.ts` (usa `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY`).
- Datos y features: módulos por dominio en `src/features/pets`, `src/features/posts`, `src/features/products` con APIs y hooks.
- Media y feed social: subida y URLs firmadas en `src/features/posts/api.ts` (storage bucket `pet_media`).
- Estado y providers: `src/providers/AppProviders.tsx` integra React Query y bootstrap de auth; Zustand en `src/store/auth.ts` y `src/store/pet-selection.ts`.
- Infra de Supabase: `supabase/config.toml` y migraciones en `supabase/migrations`.

# Feed Técnico (Pettii)

Documento técnico del sistema de feed social en Pettii.

## Objetivo

Definir cómo se selecciona, modera, rankea y opera el contenido del feed para garantizar:

- relevancia para el usuario,
- seguridad de comunidad,
- escalabilidad operativa,
- trazabilidad de decisiones.

## Estado actual (implementado)

### Fuente de datos del feed

El feed en app usa RPC de Supabase:

- `public.fetch_ranked_feed(p_follower_pet_id, p_limit, p_offset)`

Integración app:

- API: `src/features/posts/api.ts` (`fetchRankedFeedPosts`)
- Hook: `src/features/posts/hooks.ts` (`useRankedFeedPosts`)
- UI: `src/app/(drawer)/(tabs)/social.tsx`

### Filtro de elegibilidad

Solo se consideran posts que cumplan:

- `visibility = 'public'`
- `moderation_status = 'approved'`

### Reportes y seguridad

Tabla de reportes:

- `public.post_reports`
- Motivos: `spam`, `violence_abuse`, `misinformation`, `other`
- Unicidad: `unique(post_id, reporter_user_id)`

Umbral automático:

- si un post alcanza `>= 3` reportes `open`:
  - pasa a `moderation_status = 'pending'`
  - se marca `moderation_reason = 'reported_by_users_threshold'`
  - se crea `moderation_job` pendiente (si no existe)

### Refresco de feed en app

Al reportar contenido:

- se invalida cache de React Query para `posts/feed`
- el feed se refresca y el post puede desaparecer si dejó de estar `approved`

## Modelo de ranking actual

La RPC `fetch_ranked_feed` construye score por post usando:

- recencia (decaimiento por horas),
- engagement (`likes + 2*comments` con `ln`),
- boost social (si la mascota del usuario sigue a la mascota autora),
- penalización por reportes abiertos.

### Fórmula base

`score = recency_component + engagement_component + social_component - report_penalty`

Configuración actual en SQL:

- recencia: `0.5 * (1 / (1 + age_hours))`
- engagement: `0.3 * ln(1 + likes + 2*comments)`
- social: `0.2 * social_boost`
- penalty: `least(0.5, reports_open * 0.1)`

### Diversidad

Para reducir repetición por autor/mascota:

- se limita a máximo `5` posts por `pet_id` en el conjunto rankeado (`pet_rank <= 5`).

## Migraciones relacionadas

En `pettii_vet/supabase/migrations`:

- `20260304130000_047_post_reports.sql`
- `20260304132000_048_post_reports_threshold.sql`
- `20260304134000_049_ranked_feed.sql`

## Contrato entre app y backend

### Entradas del feed

- `p_follower_pet_id`: mascota activa en app (puede ser `null`)
- `p_limit`: cantidad de posts por página
- `p_offset`: desplazamiento

### Salida del feed

- retorna `setof public.posts`
- app firma URLs de media desde storage vía `attachSignedUrls`

## Consideraciones de rendimiento

### Riesgos actuales

- cálculo de likes/comentarios/reportes por post con subconsultas puede crecer en costo al escalar volumen.

### Próxima mejora recomendada

- introducir agregados materializados/diarios (`post_metrics_daily`) para evitar cálculo intensivo por request.

## Operación y monitoreo

### Métricas mínimas sugeridas

- impresiones por post,
- likes por impresión,
- comentarios por impresión,
- reportes por 1k impresiones,
- porcentaje de posts que caen a `pending` por umbral,
- tiempo de resolución de reportes.

### Alertas sugeridas

- pico de reportes por minuto,
- caída abrupta de contenido aprobado,
- errores en RPC de feed,
- errores de inserción en `post_reports`.

## Reglas de producto vigentes

- un usuario no puede reportar el mismo post más de una vez;
- contenido con alta señal de riesgo (>=3 reportes abiertos) se retira temporalmente de circulación;
- decisión final de moderación queda en pipeline de revisión (`moderation_jobs`).

## Roadmap técnico recomendado

1. Paginación por cursor en feed (en lugar de offset grande).
2. Métricas agregadas para ranking (`post_metrics_daily`).
3. Tabla de impresiones (`feed_impressions`) para aprender de consumo.
4. Personalización por afinidad de categorías/mascotas.
5. Ajuste A/B de pesos de ranking.
6. Panel interno de moderación con SLA y estados.

## Checklist para cambios futuros de ranking

Antes de modificar pesos o reglas:

- documentar objetivo del cambio,
- versionar migración SQL,
- validar costo de query con `EXPLAIN ANALYZE`,
- definir métrica de éxito,
- desplegar de forma gradual,
- monitorear 24-72h,
- actualizar este documento.

# LivingScripture

Experiencia inmersiva de lectura de la **Biblia Latinoamericana** construida con React + TypeScript + Vite.

Este proyecto está diseñado como una Web App moderna con énfasis en:

- lectura elegante y fluida,
- navegación por libros/capítulos,
- búsqueda de versículos,
- progreso de lectura persistente,
- soporte **offline real**.

---

## Stack técnico

- **React 19** + TypeScript
- **Vite 7**
- **Tailwind CSS 4**
- **Zustand** (estado de progreso de lectura)
- **GSAP** (animaciones)
- **Service Worker + IndexedDB** (offline)

---

## Cómo ejecutar el proyecto

```bash
pnpm install
pnpm dev
```

Scripts útiles:

```bash
pnpm lint
pnpm build
pnpm preview
```

---

## Funcionamiento general de la app

La app tiene dos vistas principales:

1. **Home** (`view = 'home'`)
   - Muestra portada/hero y accesos para comenzar o continuar lectura.
2. **Reader** (`view = 'reader'`)
   - Muestra capítulo completo, progreso de scroll y transición al siguiente capítulo.

El flujo vive en `src/App.tsx`, que orquesta:

- selección de libro/capítulo actual,
- apertura del orb de navegación (`NavigationOrb`),
- objetivo de búsqueda (libro/capítulo/versículo),
- integración de soporte offline.

---

## Módulos clave

### 1) Capa de datos bíblicos

Archivo principal: `src/lib/api.ts`

Responsabilidades:

- `getBooks()` retorna lista de libros.
- `getChapter(abbrev, chapter)` retorna capítulo y versículos.
- `searchVerses(query)` busca texto dentro de los versículos.
- `getNextChapter(...)` resuelve navegación al siguiente capítulo/libro.

Los datos se sirven desde una fuente local (`src/data/biblia-latinoamericana`) y se cachean en IndexedDB para acelerar y robustecer el modo offline.

### 2) Lector de capítulo

Archivo: `src/components/ScriptureReader.tsx`

Incluye:

- carga de capítulo,
- restauración de posición previa (scroll/versículo),
- cálculo de progreso de lectura,
- marcado de capítulo completado,
- transición visual al siguiente capítulo.

### 3) Navegación Orb

Archivos:

- `src/components/NavigationOrb.tsx`
- `src/components/NavigationOrbSearchPanel.tsx`

Permite:

- navegar por índice de libros,
- abrir rejilla de capítulos,
- buscar versículos,
- saltar directo al capítulo/versículo seleccionado.

Cuando no hay conexión, el panel de búsqueda informa el estado offline y mantiene búsqueda local sobre contenido disponible.

### 4) Progreso de lectura

Archivo: `src/hooks/useReadingProgress.ts`

Con Zustand + persistencia:

- estado por capítulo (`unread`, `in-progress`, `completed`),
- porcentaje de scroll y último versículo visible,
- última posición de lectura para “continuar donde te quedaste”.

---

## Arquitectura Offline (PWA)

### Service Worker

Archivo: `public/service-worker.js`

Estrategias:

- **Network First** para navegación (`request.mode === 'navigate'`) con fallback a `index.html` cacheado.
- **Stale While Revalidate** para assets estáticos (`/assets`, scripts, estilos, fuentes, imágenes).

Registro del SW:

- `src/hooks/useServiceWorkerRegistration.ts`
- activado desde `src/hooks/useOfflineSupport.ts`

### IndexedDB

Archivo: `src/storage/offlineBibleCache.ts`

Stores:

- `books` → libros cacheados
- `chapters` → capítulos cacheados
- `progressQueue` → cola de eventos de progreso para sincronización diferida

API cache-first:

- `src/lib/api.ts` intenta primero leer cache (`readCachedBooks`, `readCachedChapter`)
- si no existe, construye desde datos locales y guarda (`cacheBooks`, `cacheChapter`)

### Hooks de soporte offline

- `useOfflineSupport` integra todo el setup.
- `useNetworkStatus` detecta online/offline.
- `useOfflineBibleBootstrap` precalienta cache inicial.
- `useProgressSyncQueue` drena cola al recuperar conexión.
- `useReadingProgressSyncActions` encola eventos de progreso cuando aplica.

---

## Estructura rápida del proyecto

```text
src/
  components/
    NavigationOrb.tsx
    NavigationOrbSearchPanel.tsx
    ScriptureReader.tsx
    Verse.tsx
    ...
  hooks/
    useOfflineSupport.ts
    useNetworkStatus.ts
    useServiceWorkerRegistration.ts
    useReadingProgress.ts
    ...
  lib/
    api.ts
  storage/
    offlineBibleCache.ts
  data/
    biblia-latinoamericana
public/
  manifest.webmanifest
  service-worker.js
```

---

## Filosofía de implementación

El código sigue enfoque React moderno:

- composición por **hooks especializados**,
- componentes con responsabilidades claras,
- side-effects encapsulados,
- lógica de dominio separada de UI.

Esto facilita mantener, escalar y evolucionar la app (por ejemplo, conectar un backend real para sincronización futura).

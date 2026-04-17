# Fynt — Auditoría de Código
**Fecha:** 2026-04-17 · **Auditor:** Senior Engineer Review · **Versión:** commit `76df8eb`

---

## Resumen Ejecutivo

| Área | Estado | Detalle |
|---|---|---|
| Stack & configuración | ✅ | Bien estructurado, versiones modernas |
| Estructura del proyecto | ⚠️ | Convenciones correctas, pero un archivo acapara el 53% del código |
| Calidad de código | ⚠️ | Tipado excelente; lógica monolítica y debug logs en producción |
| Seguridad | ⚠️ | RLS activo, .env ignorado, non-null assertions riesgosas |
| Performance | ⚠️ | Sin skeletons, sin memoización, re-renders evitables |
| UX / Accesibilidad | ⚠️ | Sin labels en inputs, sin confirmaciones de acciones destructivas |
| Portafolio-readiness | ⚠️ | README funcional pero sin screenshots ni badges |

---

## 1. Stack Detectado

| Capa | Tecnología | Versión |
|---|---|---|
| Framework | Next.js (App Router) | 14.2.5 |
| Lenguaje | TypeScript | ^5 |
| Base de datos / BaaS | Supabase (PostgreSQL + Auth) | ^2.103.2 |
| Auth | Supabase SSR + Google OAuth | — |
| Estilos | Tailwind CSS + design tokens propios | ^3.4.1 |
| UI components | Artesanales (Bar, Dot, Editable) | — |
| PWA | next-pwa | ^5.6.0 |
| Fonts | DM Sans + DM Mono (Google Fonts) | — |
| Deploy | Vercel | — |

---

## 2. Estructura del Proyecto

```
finanzas-app/
├── app/
│   ├── globals.css
│   ├── layout.tsx              ← metadata, PWA config
│   ├── page.tsx                ← redirect root → /auth
│   ├── api/auth/callback/      ← OAuth callback handler
│   ├── auth/
│   │   ├── page.tsx            ← login/register UI
│   │   └── callback/route.ts   ← re-export del api route
│   └── dashboard/
│       ├── layout.tsx
│       ├── page.tsx            ← Server Component, carga datos inicial
│       └── DashboardClient.tsx ← ⚠️ 899 líneas — todo el app en un archivo
├── components/ui/
│   ├── Bar.tsx                 ← progress bar
│   ├── Dot.tsx                 ← color dot por categoría
│   └── Editable.tsx            ← inline edit component
├── lib/
│   ├── supabase.ts             ← browser client
│   ├── supabase-server.ts      ← server client (cookies)
│   └── utils.ts                ← fmtCOP, getPeriodo, COLOR_CAT
├── types/index.ts
├── middleware.ts               ← protección de rutas
├── supabase/schema.sql
└── public/manifest.json
```

**Observaciones:**
- La separación Server Component (`page.tsx`) / Client Component (`DashboardClient.tsx`) es correcta y aplica bien el modelo de Next.js App Router.
- No hay carpeta `hooks/` ni `context/` — toda la lógica de estado vive en un solo componente.
- `app/auth/callback/route.ts` solo re-exporta `app/api/auth/callback/route.ts`. Estructura confusa pero funcional.

---

## 3. Issues Priorizados

### 🔴 Críticos

---

**[C-1] Console.logs de debug en producción**
- **Archivo:** `app/dashboard/DashboardClient.tsx`, líneas 133, 141, 179, 184
- **Problema:** Cuatro `console.log` que exponen `userId`, `monto` y `periodo` del usuario en la consola del navegador en producción.
- **Solución:** Eliminar o envolver en `if (process.env.NODE_ENV === "development")`.

```typescript
// ❌ Actual
console.log("[addFijo] insertando:", { userId, nombre: nFijo.nombre, ... });

// ✅ Fix
if (process.env.NODE_ENV === "development") {
  console.log("[addFijo] insertando:", { userId, nombre: nFijo.nombre, ... });
}
```

---

**[C-2] Non-null assertions sobre variables de entorno**
- **Archivos:** `lib/supabase.ts` (L10-11), `lib/supabase-server.ts` (L9-10), `middleware.ts` (L13-14)
- **Problema:** El operador `!` fuerza el tipo pero si la variable no está definida en Vercel, el error en runtime es críptico (`Cannot read properties of undefined`).
- **Solución:** Validar explícitamente al arrancar.

```typescript
// ✅ Fix en lib/supabase.ts
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) throw new Error("Faltan variables de entorno de Supabase");
return createBrowserClient(url, key);
```

---

**[C-3] Error handling ausente en deudas, abonos y ediciones**
- **Archivo:** `app/dashboard/DashboardClient.tsx`
- **Líneas afectadas:** `addDeuda` (L229), `editDeuda` (L240), `delDeuda` (L246), `addAbono` (L253), `delAbono` (L266), `addAumento` (L275), `editVar` (L213), `delVar` (L219), `cambiarPeriodo` — auto-copy (L107-L119)
- **Problema:** Si cualquiera de estas operaciones falla en Supabase, el estado local ya fue modificado (optimistic update) pero el usuario no recibe ningún feedback. Los datos quedan inconsistentes hasta el próximo reload.
- **Solución:** Aplicar el mismo patrón ya usado en `addFijo` y `addIngreso`: capturar `error` y llamar `setError(...)`.

---

### 🟡 Mejorables

---

**[M-1] DashboardClient.tsx tiene 899 líneas — componente monolítico**
- **Archivo:** `app/dashboard/DashboardClient.tsx`
- **Problema:** Un solo archivo contiene estado global, 12 funciones async, y 4 tabs de UI completos. Dificulta el mantenimiento y la legibilidad para un revisor externo (ej: reclutador técnico).
- **Solución:** Dividir en componentes por tab. Estructura sugerida:

```
app/dashboard/
├── DashboardClient.tsx   ← orquestador, solo estado y layout principal
├── components/
│   ├── IngresoModal.tsx
│   ├── FijosTab.tsx
│   ├── VariablesTab.tsx
│   ├── DeudasTab.tsx
│   └── ResumenTab.tsx
└── hooks/
    └── useDashboard.ts   ← toda la lógica async de Supabase
```

---

**[M-2] Constante mágica `0.20` repetida tres veces**
- **Archivo:** `app/dashboard/DashboardClient.tsx`, líneas ~576, ~578, ~878
- **Problema:** El límite recomendado del 20% para gastos variables está hardcodeado. Si cambia, hay que buscarlo en tres lugares.
- **Solución:**
```typescript
// Al inicio del componente o en utils.ts
const LIMITE_VARIABLES_PCT = 0.20;
```

---

**[M-3] Umbrales de color de la barra de progreso hardcodeados**
- **Archivo:** `app/dashboard/DashboardClient.tsx`, línea ~425
- **Problema:** `pct >= 90` y `pct >= 70` son magic numbers sin nombre.
- **Solución:**
```typescript
const ALERTA_ROJA  = 90;
const ALERTA_AMBER = 70;
```

---

**[M-4] Inline styles mezclados con clases Tailwind**
- **Archivo:** `app/dashboard/DashboardClient.tsx` — menú dropdown (líneas ~377-415)
- **Problema:** El dropdown usa inline style objects con ~15 valores hardcodeados (`"rgba(255,255,255,0.08)"`, `"#252547"`, etc.) que no siguen el sistema de diseño definido en `tailwind.config.ts`.
- **Solución:** Mover esos colores al tema de Tailwind (`brand.overlay`, `brand.surface`) o usar clases CSS.

---

**[M-5] Sin validación de input en formularios**
- **Archivo:** `app/dashboard/DashboardClient.tsx`
- **Problema:** Solo se valida que `monto` sea un número positivo y que `nombre` no esté vacío. No hay límite de longitud, sanitización de strings, ni validación de rangos razonables (ej: un monto de `999999999999`).
- **Solución:** Agregar validaciones mínimas:
```typescript
if (nFijo.nombre.trim().length > 100) return;
if (monto > 100_000_000) return; // límite razonable para COP
```

---

**[M-6] Sin loading states en carga de datos por periodo**
- **Archivo:** `app/dashboard/DashboardClient.tsx`, función `cambiarPeriodo`
- **Problema:** Al navegar entre meses, los arrays se vacían (`setFijos([])`) y se muestran vacíos hasta que llega la respuesta. No hay skeleton ni spinner, lo que parece un bug al usuario.
- **Solución:** Agregar un estado `loadingPeriodo` que muestre un skeleton mientras se cargan los datos.

---

**[M-7] Inputs sin `<label>` — accesibilidad**
- **Archivo:** `app/dashboard/DashboardClient.tsx` y `app/auth/page.tsx`
- **Problema:** Los inputs usan solo `placeholder` como identificación visual. Screen readers y autocompletion del browser no funcionan correctamente sin `<label>` asociado.
- **Solución:**
```tsx
<label htmlFor="monto-input" className="sr-only">Monto</label>
<input id="monto-input" type="number" ... />
```

---

**[M-8] Sin confirmación en acciones destructivas**
- **Archivo:** `app/dashboard/DashboardClient.tsx`
- **Problema:** Eliminar un gasto fijo, una deuda o un ingreso es inmediato sin ningún confirm. Un tap accidental en mobile borra datos irreversiblemente.
- **Solución:** Al menos un `window.confirm` o un mini-modal de confirmación para `delDeuda` (la acción más destructiva, que borra también todos los abonos asociados).

---

**[M-9] `createClient()` instanciado en el render del componente**
- **Archivo:** `app/dashboard/DashboardClient.tsx`, línea 30
- **Problema:** `const supabase = createClient()` se ejecuta en cada render. Aunque `@supabase/ssr` lo maneja bien internamente, el patrón correcto es memoizarlo.
- **Solución:**
```typescript
const supabase = useMemo(() => createClient(), []);
```

---

**[M-10] next-pwa sin configurar correctamente para App Router**
- **Archivo:** `next.config.js`
- **Problema:** `next-pwa@5.6.0` no tiene soporte oficial para Next.js App Router. Puede causar conflictos con el SW (service worker). La alternativa mantenida activamente es `@ducanh2912/next-pwa`.
- **Solución:** Evaluar migrar a `@ducanh2912/next-pwa` o implementar el SW manualmente via `public/sw.js`.

---

### 🟢 Nice-to-have

---

**[N-1] README sin screenshots ni demo link**
- **Archivo:** `README.md`
- **Problema:** Para portafolio, el README necesita una imagen/GIF del dashboard en uso. Un reclutador que llega al repo no tiene contexto visual inmediato.
- **Solución:** Agregar sección `## Preview` con screenshot del dashboard y un link a la app en producción.

---

**[N-2] Sin tests**
- **Problema:** No existe ningún archivo de test (unit, integration, e2e). Para portafolio senior esto es un gap visible.
- **Solución:** Al menos 2-3 tests unitarios para `utils.ts` (fmtCOP, getPeriodo, prevPeriodo/nextPeriodo) con Vitest o Jest.

---

**[N-3] Historial de git limpio pero comprimido**
- **Observación:** 11 commits, todos descriptivos y en inglés. Buena práctica. El historial podría beneficiarse de feature branches (`feat/debt-tracker`, `feat/header-redesign`) para mostrar flujo de trabajo colaborativo, aunque en un proyecto personal no es crítico.

---

**[N-4] Sin `description` en package.json**
- **Archivo:** `package.json`
- **Solución:**
```json
"description": "Personal finance dashboard with Supabase, Next.js and PWA support"
```

---

**[N-5] Google Fonts cargado via `<link>` en lugar de `next/font`**
- **Archivo:** `app/layout.tsx`, línea 29
- **Problema:** `next/font` optimiza automáticamente fonts (self-hosting, no layout shift, caching). El `<link>` externo bloquea rendering y depende de la CDN de Google.
- **Solución:**
```typescript
import { DM_Sans, DM_Mono } from "next/font/google";
const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400","500","600","700","800"] });
```

---

**[N-6] Tipo `Perfil.ingreso_quincenal` es un naming legacy**
- **Archivo:** `types/index.ts`, línea 44
- **Problema:** Después del refactor a modelo mensual, el campo todavía se llama `ingreso_quincenal` en el tipo `Perfil` (y presumiblemente en la tabla de Supabase).
- **Solución:** Renombrar a `ingreso_mensual` en la DB y en el tipo.

---

## 4. Seguridad — Detalle

| Check | Estado | Nota |
|---|---|---|
| API keys en `.env`, no en código | ✅ | Correcto |
| `.env` y `.env.local` en `.gitignore` | ✅ | Ambos ignorados |
| Row Level Security en Supabase | ✅ | Todas las tablas con RLS + policies por `auth.uid()` |
| Rutas protegidas por middleware | ✅ | `/dashboard` requiere sesión activa |
| Input sanitization | ⚠️ | Solo validación básica de tipo/vacío |
| Non-null assertions en env vars | ⚠️ | Riesgo de crash en runtime si faltan |
| Secrets hardcodeados en código | ✅ | Ninguno encontrado |
| Datos sensibles en frontend | ✅ | Solo `NEXT_PUBLIC_*` expuestos (esperado) |

---

## 5. Performance — Detalle

| Check | Estado | Nota |
|---|---|---|
| Server Component para carga inicial | ✅ | `page.tsx` carga todos los datos en servidor |
| Sin waterfalls en data fetching | ✅ | `Promise.all` en la carga inicial |
| Loading states en cambio de periodo | ❌ | Los arrays se vacían sin feedback visual |
| Memoización de callbacks pesados | ⚠️ | Solo `pagadoPor` usa `useCallback`, handlers de forms no |
| Imágenes optimizadas | ✅ | No hay imágenes de usuario (fuera de iconos PWA) |
| PWA / offline | ⚠️ | next-pwa configurado pero compatibilidad con App Router no verificada |
| Code splitting | ✅ | Next.js lo hace automáticamente por ruta |

---

## 6. Lo que está bien ✅

1. **Arquitectura Server/Client correcta.** El uso de Server Component en `page.tsx` para la carga inicial y Client Component para la interactividad es exactamente el patrón que Next.js App Router recomienda. Elimina un round-trip del cliente y mejora el First Contentful Paint.

2. **TypeScript sin `any`.** Cero usos de `any` en todo el proyecto. Todos los tipos están definidos explícitamente en `types/index.ts` e importados donde se usan.

3. **RLS bien configurado en Supabase.** Todas las tablas tienen Row Level Security activo con policies que validan `auth.uid() = user_id`. La tabla `ingresos` incluso maneja el cast correcto `auth.uid()::text` para el campo `user_id text`.

4. **Design system consistente.** Los colores están centralizados en `tailwind.config.ts` (`brand.*`) y en `COLOR_CAT` en `utils.ts`. No hay hex codes sueltos en la mayoría del código base.

5. **Middleware de protección de rutas.** La autenticación se verifica a nivel de Edge en el middleware, antes de que cualquier página cargue. Patrón correcto para Next.js.

6. **Separación de clientes Supabase.** `lib/supabase.ts` (browser) y `lib/supabase-server.ts` (server+cookies) están correctamente separados, evitando usar el cliente de servidor en el browser y viceversa.

7. **Auto-copy de gastos fijos entre meses.** La lógica en `cambiarPeriodo` que detecta un mes vacío y copia los fijos del mes anterior es una feature UX inteligente que reduce fricción real del usuario.

8. **Commits descriptivos.** El historial de git tiene mensajes claros y en inglés (`"Add debt tracker with payment history"`, `"Refactor: replace quincenas with monthly period model"`). Habla bien del proceso de desarrollo.

9. **PWA habilitada.** Con `manifest.json` y `next-pwa`, la app es instalable en mobile, lo que la diferencia de un CRUD básico de portafolio.

10. **Componente `Editable`** para edición inline es una solución elegante que evita modales para cambios simples, mejorando la UX mobile.

---

## Métricas de Referencia

| Métrica | Valor |
|---|---|
| Total archivos fuente | 23 |
| Líneas de código (sin node_modules) | ~1.700 |
| Archivo más grande | `DashboardClient.tsx` — 899 líneas (53% del total) |
| `console.log` en producción | 4 |
| Operaciones async sin error handling | 9 |
| Uso de TypeScript `any` | 0 |
| Magic numbers/strings | ~18 |
| Cobertura de tests | 0% |
| Commits totales | 11 |

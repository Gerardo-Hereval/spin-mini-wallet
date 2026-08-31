# Mini Wallet Web App — Design Spec

**Challenge:** Spin — Web Challenge (Mini Wallet)
**Fecha:** 2026-08-31
**Nivel objetivo:** Senior / completo

## 1. Objetivo

Web app en Next.js + TypeScript que simula el flujo de una wallet financiera con datos
mockeados:

```
Login → Home → Nueva Transacción → Confirmación / Comprobante
```

Sin backend ni autenticación reales. La evaluación mira decisiones reales de desarrollo:
tipado, arquitectura, estado, reglas de negocio en el lugar correcto, manejo de errores,
componentes reutilizables, y escalabilidad/mantenibilidad para un contexto de "millones de
usuarios".

## 2. Stack técnico (con justificación para DECISIONS.md)

| Aspecto | Decisión | Justificación |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | Server Components + Server Actions, rendering por ruta, es lo que Spin insinúa al valorar Server Actions. |
| Rendering | Mixto por ruta (ver §6) | Cada pantalla usa la estrategia que le conviene; justificado caso por caso. |
| Estado servidor | TanStack Query | Cache, estados loading/empty/error automáticos, refetch, deduplicación de requests (clave con alto volumen). |
| Estado cliente | Zustand | Sesión (persistida) y estado del wizard de transacción. Ligero, sin boilerplate de Redux. |
| UI / diseño | shadcn/ui + **thegridcn-ui** (tema Tron/Poseidon) | Componentes que uno posee (raw TSX), accesibles; thegridcn aporta identidad visual distintiva sobre Tailwind. |
| Estilos | Tailwind CSS | Estándar en Next.js, responsive rápido. |
| Testing unitario | Vitest + React Testing Library | Rápido, buen DX con Next; cubre validaciones, hooks y componentes críticos. |
| E2E | Playwright | Estándar de facto, multi-browser, buen soporte para mock/routing determinista. |

### Nota sobre thegridcn-ui

thegridcn-ui es un sistema de temas inspirado en Tron: Ares sobre shadcn/ui (estética
neón/HUD, temas con `oklch`, efectos Three.js). Se integra vía registry de shadcn:

```jsonc
// components.json
{ "registries": { "@thegridcn": "https://thegridcn.com/r/{name}.json" } }
```

```bash
npx shadcn@latest add @thegridcn/button
npx shadcn@latest add @thegridcn/theme-poseidon   # tema elegido
```

Se aplica un tema vía `data-theme` en `<html>` y un `ThemeProvider`. Se usan componentes base
+ acentos Tron con moderación (p. ej. un fondo de grid sutil), sin abusar de HUD/Three.js:
la app financiera debe seguir siendo legible y usable. **Pragmatismo sobre espectáculo.**

## 3. Arquitectura y estructura de carpetas

Principio central: **separar dominio (reglas de negocio puras) de UI y de infraestructura
(mock/API)**. El dominio no importa React ni Next; es testeable de forma aislada.

```
src/
  app/
    (auth)/login/page.tsx          # CSR — formulario interactivo
    (app)/
      layout.tsx                   # layout protegido (lee sesión en servidor)
      home/page.tsx                # Server Component: SSR de saldo + movimientos
      transfer/page.tsx            # CSR — wizard de transacción
    api/
      auth/login/route.ts          # setea cookie de sesión mock
      auth/logout/route.ts         # limpia cookie
      wallet/route.ts              # saldo + usuario
      movements/route.ts           # lista de movimientos
      contacts/route.ts            # GET (favoritos) / POST (guardar nuevo)
      transactions/route.ts        # POST → resultado ALEATORIO (5 escenarios)
    providers.tsx                  # QueryClientProvider + ThemeProvider
    layout.tsx                     # root layout
  domain/                          # lógica pura, sin React
    money/
      money.ts                     # Money en centavos (int) + parse/format
      money.test.ts
    transaction/
      types.ts                     # TransactionInput, TransactionResult (union discriminada)
      rules.ts                     # validateTransaction() — funciones puras
      rules.test.ts
    session/types.ts               # Session, User
    contact/types.ts               # Contact
    movement/types.ts              # Movement
  lib/
    api-client.ts                  # wrappers fetch tipados
    mock/
      data.ts                      # datos en memoria (usuario, saldo, movimientos, contactos)
      latency.ts                   # helpers de delay
      outcome.ts                   # selección aleatoria/determinista de escenario
    session.ts                     # helpers para leer/escribir la cookie de sesión
  stores/
    session-store.ts               # Zustand (persist) — espejo cliente de la sesión
    transfer-store.ts              # Zustand — estado del wizard
  hooks/
    use-wallet.ts                  # TanStack Query
    use-movements.ts
    use-contacts.ts                # query + mutation (guardar contacto)
    use-create-transaction.ts      # mutation → mapea outcome a UI
  components/
    ui/                            # shadcn + thegridcn (owned)
    feature/                       # componentes de dominio (AmountInput, ContactPicker, ...)
  middleware.ts                    # guard de rutas (app) por cookie de sesión
```

## 4. Modelos de dominio (tipado con intención)

Todos los montos se manejan en **centavos (enteros)** para evitar errores de punto flotante
— requisito de una app financiera. El formateo a string ocurre solo en el borde de UI.

```ts
// money/money.ts
type Cents = number & { readonly __brand: 'Cents' };
function toCents(input: string | number): Cents;      // parse seguro
function formatMoney(c: Cents, currency?: string): string;

// transaction/types.ts
interface TransactionInput {
  amountCents: Cents;
  recipient: Contact | null;
}
type TransactionResult =
  | { status: 'success'; receipt: Receipt }
  | { status: 'network_error' }
  | { status: 'insufficient_funds' }
  | { status: 'timeout' }
  | { status: 'unknown_error' };

// session/types.ts
interface User { id: string; name: string; }
interface Session { user: User; token: string; }
```

## 5. Reglas de negocio (corazón de la evaluación)

`domain/transaction/rules.ts` expone **funciones puras** sin dependencia de React ni del DOM:

```ts
type ValidationError =
  | { code: 'amount_required' }
  | { code: 'amount_not_positive' }      // monto 0 o negativo
  | { code: 'insufficient_balance' }     // monto > saldo
  | { code: 'recipient_required' };      // sin destinatario

type ValidationResult =
  | { ok: true; input: TransactionInput }
  | { ok: false; errors: ValidationError[] };

function validateTransaction(
  raw: { amountCents: Cents | null; recipient: Contact | null },
  ctx: { balanceCents: Cents },
): ValidationResult;
```

**La misma función se usa en dos lugares** (una sola fuente de verdad):

1. **Cliente** — habilita/deshabilita el botón de confirmar y muestra errores inline en tiempo real.
2. **Servidor** — el API route `POST /api/transactions` la ejecuta de nuevo antes de "procesar";
   si falla, responde 422 con los códigos de error. Esto cumple explícitamente "validaciones
   en el lugar correcto, no solo en la UI".

Reglas cubiertas: monto > 0, monto ≤ saldo disponible, destinatario obligatorio.

## 6. Estrategia de rendering (justificable por ruta)

| Ruta | Estrategia | Por qué |
|---|---|---|
| `/login` | CSR | Interacción pura de formulario; no hay datos de servidor que pre-renderizar. |
| `/home` | SSR (Server Component) | Trae saldo + movimientos iniciales en el servidor (primer paint rápido, mejor con alto volumen). TanStack Query hidrata en cliente para refresh y estados loading/empty/error. |
| `/transfer` | CSR | Wizard muy interactivo con estado de cliente (monto, contacto, pasos). |
| Confirmación | API route + mutación | La aleatoriedad y el reintento se manejan mejor con mutación cliente. Server Action se menciona como alternativa en DECISIONS.md. |

## 7. Flujo de Nueva Transacción (wizard)

Estado en `transfer-store` (Zustand). Pasos:

1. **Monto** — `AmountInput` valida formato; convierte a centavos.
2. **Destinatario** — `ContactPicker`: elegir de favoritos (query) o crear uno nuevo
   (formulario + `POST /api/contacts`, se guarda en el mock y aparece en la lista).
3. **Resumen** — muestra monto + destinatario + saldo resultante antes de confirmar.
   Botón de confirmar deshabilitado si `validateTransaction` falla.
4. **Confirmación** — `POST /api/transactions` → outcome aleatorio.
5. **Comprobante / estado de error** — según el outcome.

## 8. Confirmación aleatoria (5 escenarios)

La aleatoriedad vive en `POST /api/transactions` (`lib/mock/outcome.ts`). Devuelve una
`TransactionResult` (union discriminada). `use-create-transaction` mapea cada caso a UI:

| Escenario | Respuesta API | UI |
|---|---|---|
| Éxito | `{ status: 'success', receipt }` | Comprobante con datos de la transacción |
| Error de red | `{ status: 'network_error' }` | Estado de error + botón **reintentar** |
| Fondos insuficientes | `{ status: 'insufficient_funds' }` (422) | Error descriptivo |
| Timeout | delay largo → `AbortController` en cliente | Estado de timeout + **reintentar** |
| Error desconocido | `{ status: 'unknown_error' }` | Fallback genérico |

**Determinismo en tests:** el mock acepta un header/query (`x-mock-outcome`) para forzar un
escenario específico, de modo que Playwright pueda probar cada rama sin depender del azar.

## 9. Sesión y navegación

- `POST /api/auth/login` valida formato (teléfono o email), simula latencia y un error
  ocasional configurable, y setea una **cookie de sesión mock** (`session=<token>`).
- `middleware.ts` protege las rutas del grupo `(app)`: sin cookie válida → redirect a `/login`.
- El `layout.tsx` de `(app)` lee la cookie en servidor para render inicial autenticado.
- `session-store` (Zustand persist) espeja el usuario para uso en cliente.
- Logout → `POST /api/auth/logout` limpia la cookie y el store.

Esto demuestra SSR + guard "real" sin autenticación real.

## 10. Estados de UI

Cada pantalla con datos asíncronos maneja **loading / empty / error** vía estados de
TanStack Query + componentes de skeleton y vacío reutilizables. Errores de red con opción de
reintento donde aplique.

## 11. Testing

**Unitario (Vitest + RTL):**
- `domain/transaction/rules` — todos los edge cases: monto 0, negativo, `null`, > saldo,
  sin destinatario, caso válido.
- `domain/money` — parse y formateo, redondeo, entradas inválidas.
- `use-create-transaction` — mapeo de cada outcome a estado de UI.
- Componentes críticos: `AmountInput` (validación/formato), `TransferSummary`.

**E2E (Playwright):**
- Happy path: login → home → transfer (elegir contacto, monto) → confirmar → comprobante.
- Path de error: forzar `network_error` → ver estado de error → reintentar.
- Guard: acceder a `/home` sin sesión → redirect a `/login`.

## 12. Documentación (entregables)

- `README.md` — setup, librerías, limitaciones conocidas, **tiempo real invertido**.
- `DECISIONS.md` — justificaciones (§2, §5, §6, §9), separación UI/lógica, edge cases, qué
  haría con más tiempo.
- `AI_USAGE.md` — herramientas de IA usadas, qué se aceptó/corrigió, qué decidió el humano.

## 13. Fuera de alcance (YAGNI)

- Autenticación/seguridad reales, backend/DB reales.
- Persistencia real de contactos/transacciones (todo en memoria del proceso mock).
- i18n, multi-moneda avanzada, paginación infinita de movimientos.
- Efectos Three.js pesados de thegridcn (solo acentos visuales ligeros).

## 14. Limitaciones conocidas

- El mock es en memoria: los datos se reinician al reiniciar el server.
- La cookie de sesión no es segura (mock), sin firma ni expiración real.
- La aleatoriedad de outcomes puede requerir el header determinista para reproducir un caso.

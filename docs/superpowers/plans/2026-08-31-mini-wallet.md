# Mini Wallet Web App — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js + TypeScript mock wallet (Login → Home → Nueva Transacción → Confirmación) with business rules in a pure domain layer, mock API routes, and full test coverage.

**Architecture:** App Router with per-route rendering (Login CSR, Home SSR, Transfer CSR). A pure `domain/` layer holds money math and transaction rules, reused on client and server. Server state via TanStack Query; client/wizard state via Zustand. Mock data lives in memory behind API routes. UI components are strictly presentational — all logic lives in `domain/`, `hooks/`, or `stores/`.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript (strict), Tailwind CSS 4, shadcn/ui + thegridcn-ui (Poseidon theme), Zustand, TanStack Query, zod, Vitest + React Testing Library (hooks only), Playwright.

## Global Constraints

- TypeScript `strict: true`. No `any`. Prefer discriminated unions for results/errors.
- **All money is integer cents** (`Cents` branded type). Formatting to string only at the UI edge.
- **UI components are presentational only** — props in, events out. No business logic, validation, fetching, or derived-state computation inside `components/`. That logic lives in `domain/`, `hooks/`, or `stores/`.
- **No unit tests for UI components.** Logic is unit-tested (Vitest); UI is covered by E2E (Playwright).
- **Business rules run on the server too** — every mutating API route re-validates with the domain layer. Never trust the client.
- **Idempotency**: `POST /api/transactions` honors an `Idempotency-Key` header.
- Session is a mock cookie: `httpOnly`, `Secure`, `SameSite=Lax`. Server derives the user from the cookie; never accept a client-supplied `userId`.
- thegridcn theme: **Poseidon**. Use base components + light Tron accents only (no heavy Three.js).
- Node 22 for build/runtime. `next.config` uses `output: 'standalone'`.
- Conventional Commits. Commit after every green test.

---

## File Structure

```
src/
  app/
    layout.tsx                      # root layout, ThemeProvider mount
    providers.tsx                   # QueryClientProvider + ThemeProvider
    globals.css                     # tailwind + thegridcn theme tokens
    (auth)/login/page.tsx           # CSR login
    (app)/
      layout.tsx                    # reads session server-side; renders shell
      home/page.tsx                 # SSR home
      transfer/page.tsx             # CSR wizard
    api/
      auth/login/route.ts
      auth/logout/route.ts
      wallet/route.ts
      movements/route.ts
      contacts/route.ts
      transactions/route.ts
  domain/
    money/money.ts, money.test.ts
    transaction/types.ts, rules.ts, rules.test.ts
    session/types.ts
    contact/types.ts
    movement/types.ts
  lib/
    api-client.ts
    session.ts                      # cookie read/write helpers
    mock/data.ts, latency.ts, outcome.ts, outcome.test.ts, store.ts
    security/headers.ts, rate-limit.ts
    validation/schemas.ts           # zod schemas
  stores/session-store.ts, transfer-store.ts
  hooks/use-wallet.ts, use-movements.ts, use-contacts.ts, use-transfer-form.ts, use-create-transaction.ts
  components/ui/*                    # shadcn + thegridcn (owned)
  components/feature/*               # AmountInput, ContactPicker, TransferSummary, Receipt, ErrorState, MovementList, ...
  middleware.ts
tests/e2e/*.spec.ts
Dockerfile
railway.toml
next.config.ts
vitest.config.ts
playwright.config.ts
```

---

## Task 1: Project scaffold + tooling

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts`, `components.json`, `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx`, `src/lib/sanity.test.ts`
- Test: `src/lib/sanity.test.ts`

**Interfaces:**
- Produces: a booting Next.js app; `npm run dev`, `npm test`, `npm run test:e2e` scripts; TanStack Query, Zustand, zod installed.

- [ ] **Step 1: Scaffold Next.js app**

Run in an empty dir (repo already has `docs/` + git):

```bash
npx create-next-app@latest . --typescript --app --tailwind --eslint --src-dir --import-alias "@/*" --no-turbopack --yes
```

- [ ] **Step 2: Install runtime + dev deps**

```bash
npm i zustand @tanstack/react-query zod
npm i -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @playwright/test
npx playwright install --with-deps chromium
```

- [ ] **Step 3: Configure `next.config.ts` for standalone**

```ts
import type { NextConfig } from 'next'
const nextConfig: NextConfig = { output: 'standalone' }
export default nextConfig
```

- [ ] **Step 4: Configure Vitest**

`vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [react()],
  test: { environment: 'jsdom', globals: true, include: ['src/**/*.test.{ts,tsx}'] },
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
})
```

Add scripts to `package.json`: `"test": "vitest run"`, `"test:watch": "vitest"`, `"test:e2e": "playwright test"`.

- [ ] **Step 5: Configure Playwright**

`playwright.config.ts`:

```ts
import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './tests/e2e',
  use: { baseURL: 'http://localhost:3000' },
  webServer: { command: 'npm run dev', url: 'http://localhost:3000', reuseExistingServer: true },
})
```

- [ ] **Step 6: Init shadcn + register thegridcn**

```bash
npx shadcn@latest init -d
```

Then edit `components.json` to add the registry:

```jsonc
{ "registries": { "@thegridcn": "https://thegridcn.com/r/{name}.json" } }
```

Install the theme + a couple base components:

```bash
npx shadcn@latest add @thegridcn/theme-poseidon
npx shadcn@latest add button input card
```

- [ ] **Step 7: Write a sanity test**

`src/lib/sanity.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
describe('sanity', () => { it('runs', () => { expect(1 + 1).toBe(2) }) })
```

- [ ] **Step 8: Run tests + typecheck**

Run: `npm test && npx tsc --noEmit`
Expected: sanity test PASS, no type errors.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with testing + thegridcn"
```

---

## Task 2: Domain — Money value object

**Files:**
- Create: `src/domain/money/money.ts`
- Test: `src/domain/money/money.test.ts`

**Interfaces:**
- Produces:
  - `type Cents = number & { readonly __brand: 'Cents' }`
  - `fromCents(n: number): Cents`
  - `toCents(input: string | number): Cents | null` — parses a decimal amount string (e.g. `"12.34"`) to cents; returns `null` on invalid/negative-sign garbage input.
  - `formatMoney(c: Cents, currency?: string): string` — e.g. `formatMoney(1234 as Cents)` → `"$12.34"`.

- [ ] **Step 1: Write failing tests**

`src/domain/money/money.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { toCents, fromCents, formatMoney } from './money'

describe('toCents', () => {
  it('parses whole numbers', () => { expect(toCents('12')).toBe(1200) })
  it('parses decimals', () => { expect(toCents('12.34')).toBe(1234) })
  it('rounds to 2 decimals', () => { expect(toCents('12.345')).toBe(1235) })
  it('rejects non-numeric', () => { expect(toCents('abc')).toBeNull() })
  it('rejects empty', () => { expect(toCents('')).toBeNull() })
  it('accepts zero', () => { expect(toCents('0')).toBe(0) })
})

describe('formatMoney', () => {
  it('formats cents to currency', () => { expect(formatMoney(fromCents(1234))).toBe('$12.34') })
  it('formats zero', () => { expect(formatMoney(fromCents(0))).toBe('$0.00') })
})
```

- [ ] **Step 2: Run to verify fail**

Run: `npx vitest run src/domain/money/money.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

`src/domain/money/money.ts`:

```ts
export type Cents = number & { readonly __brand: 'Cents' }

export function fromCents(n: number): Cents {
  return Math.round(n) as Cents
}

export function toCents(input: string | number): Cents | null {
  const s = String(input).trim()
  if (s === '' || !/^\d+(\.\d+)?$/.test(s)) return null
  const value = Number(s)
  if (!Number.isFinite(value)) return null
  return Math.round(value * 100) as Cents
}

export function formatMoney(c: Cents, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(c / 100)
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/domain/money/money.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/money
git commit -m "feat(domain): add Money value object in cents"
```

---

## Task 3: Domain — Transaction types + validation rules

**Files:**
- Create: `src/domain/transaction/types.ts`, `src/domain/transaction/rules.ts`, `src/domain/contact/types.ts`
- Test: `src/domain/transaction/rules.test.ts`

**Interfaces:**
- Consumes: `Cents` from Task 2.
- Produces:
  - `interface Contact { id: string; name: string; handle: string }` (`contact/types.ts`)
  - `interface TransactionInput { amountCents: Cents; recipient: Contact }`
  - `type ValidationError = { code: 'amount_required' } | { code: 'amount_not_positive' } | { code: 'insufficient_balance' } | { code: 'recipient_required' }`
  - `type ValidationResult = { ok: true; input: TransactionInput } | { ok: false; errors: ValidationError[] }`
  - `interface Receipt { id: string; amountCents: Cents; recipient: Contact; createdAt: string }`
  - `type TransactionResult = { status: 'success'; receipt: Receipt } | { status: 'network_error' } | { status: 'insufficient_funds' } | { status: 'timeout' } | { status: 'unknown_error' }`
  - `validateTransaction(raw: { amountCents: Cents | null; recipient: Contact | null }, ctx: { balanceCents: Cents }): ValidationResult`

- [ ] **Step 1: Write failing tests**

`src/domain/transaction/rules.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { validateTransaction } from './rules'
import { fromCents } from '@/domain/money/money'

const contact = { id: '1', name: 'Ana', handle: 'ana@x.com' }
const ctx = { balanceCents: fromCents(10000) } // $100

describe('validateTransaction', () => {
  it('accepts a valid transaction', () => {
    const r = validateTransaction({ amountCents: fromCents(5000), recipient: contact }, ctx)
    expect(r.ok).toBe(true)
  })
  it('rejects null amount', () => {
    const r = validateTransaction({ amountCents: null, recipient: contact }, ctx)
    expect(r).toEqual({ ok: false, errors: [{ code: 'amount_required' }] })
  })
  it('rejects zero amount', () => {
    const r = validateTransaction({ amountCents: fromCents(0), recipient: contact }, ctx)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors).toContainEqual({ code: 'amount_not_positive' })
  })
  it('rejects amount over balance', () => {
    const r = validateTransaction({ amountCents: fromCents(20000), recipient: contact }, ctx)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors).toContainEqual({ code: 'insufficient_balance' })
  })
  it('rejects missing recipient', () => {
    const r = validateTransaction({ amountCents: fromCents(5000), recipient: null }, ctx)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors).toContainEqual({ code: 'recipient_required' })
  })
  it('collects multiple errors', () => {
    const r = validateTransaction({ amountCents: null, recipient: null }, ctx)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.length).toBe(2)
  })
})
```

- [ ] **Step 2: Run to verify fail**

Run: `npx vitest run src/domain/transaction/rules.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement types**

`src/domain/contact/types.ts`:

```ts
export interface Contact { id: string; name: string; handle: string }
```

`src/domain/transaction/types.ts`:

```ts
import type { Cents } from '@/domain/money/money'
import type { Contact } from '@/domain/contact/types'

export interface TransactionInput { amountCents: Cents; recipient: Contact }

export type ValidationError =
  | { code: 'amount_required' }
  | { code: 'amount_not_positive' }
  | { code: 'insufficient_balance' }
  | { code: 'recipient_required' }

export type ValidationResult =
  | { ok: true; input: TransactionInput }
  | { ok: false; errors: ValidationError[] }

export interface Receipt { id: string; amountCents: Cents; recipient: Contact; createdAt: string }

export type TransactionResult =
  | { status: 'success'; receipt: Receipt }
  | { status: 'network_error' }
  | { status: 'insufficient_funds' }
  | { status: 'timeout' }
  | { status: 'unknown_error' }
```

- [ ] **Step 4: Implement rules**

`src/domain/transaction/rules.ts`:

```ts
import type { Cents } from '@/domain/money/money'
import type { Contact } from '@/domain/contact/types'
import type { ValidationError, ValidationResult } from './types'

export function validateTransaction(
  raw: { amountCents: Cents | null; recipient: Contact | null },
  ctx: { balanceCents: Cents },
): ValidationResult {
  const errors: ValidationError[] = []

  if (raw.amountCents === null) {
    errors.push({ code: 'amount_required' })
  } else if (raw.amountCents <= 0) {
    errors.push({ code: 'amount_not_positive' })
  } else if (raw.amountCents > ctx.balanceCents) {
    errors.push({ code: 'insufficient_balance' })
  }

  if (raw.recipient === null) errors.push({ code: 'recipient_required' })

  if (errors.length > 0) return { ok: false, errors }
  return { ok: true, input: { amountCents: raw.amountCents as Cents, recipient: raw.recipient as Contact } }
}
```

- [ ] **Step 5: Run to verify pass**

Run: `npx vitest run src/domain/transaction/rules.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/domain
git commit -m "feat(domain): add transaction types and validation rules"
```

---

## Task 4: Mock data store + latency + outcome selector

**Files:**
- Create: `src/domain/session/types.ts`, `src/domain/movement/types.ts`, `src/lib/mock/data.ts`, `src/lib/mock/latency.ts`, `src/lib/mock/store.ts`, `src/lib/mock/outcome.ts`
- Test: `src/lib/mock/outcome.test.ts`

**Interfaces:**
- Consumes: `Cents`, `Contact`, `TransactionResult`, `Receipt`.
- Produces:
  - `interface User { id: string; name: string }` (`session/types.ts`)
  - `interface Session { user: User; token: string }`
  - `interface Movement { id: string; description: string; amountCents: Cents; direction: 'in' | 'out'; createdAt: string }`
  - `store`: in-memory singleton — `getWallet()`, `getMovements()`, `listContacts()`, `addContact(name, handle): Contact`, `getBalanceCents()`, `applyTransaction(receipt)`, idempotency map `getReceiptByKey(key)`, `saveReceiptForKey(key, receipt)`.
  - `randomDelay(minMs, maxMs): Promise<void>` (`latency.ts`).
  - `type OutcomeName = 'success' | 'network_error' | 'insufficient_funds' | 'timeout' | 'unknown_error'`
  - `pickOutcome(forced?: string | null): OutcomeName` (`outcome.ts`) — returns `forced` if it is a valid `OutcomeName`, else a pseudo-random one weighted toward success.

- [ ] **Step 1: Write failing tests for outcome**

`src/lib/mock/outcome.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { pickOutcome, OUTCOME_NAMES } from './outcome'

describe('pickOutcome', () => {
  it('honors a forced valid outcome', () => {
    expect(pickOutcome('timeout')).toBe('timeout')
    expect(pickOutcome('insufficient_funds')).toBe('insufficient_funds')
  })
  it('ignores an invalid forced value and returns a valid outcome', () => {
    const r = pickOutcome('garbage')
    expect(OUTCOME_NAMES).toContain(r)
  })
  it('returns a valid outcome when unforced', () => {
    const r = pickOutcome(null)
    expect(OUTCOME_NAMES).toContain(r)
  })
})
```

- [ ] **Step 2: Run to verify fail**

Run: `npx vitest run src/lib/mock/outcome.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement types + latency**

`src/domain/session/types.ts`:

```ts
export interface User { id: string; name: string }
export interface Session { user: User; token: string }
```

`src/domain/movement/types.ts`:

```ts
import type { Cents } from '@/domain/money/money'
export interface Movement {
  id: string; description: string; amountCents: Cents
  direction: 'in' | 'out'; createdAt: string
}
```

`src/lib/mock/latency.ts`:

```ts
export function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const ms = minMs + Math.floor(Math.random() * (maxMs - minMs))
  return new Promise((resolve) => setTimeout(resolve, ms))
}
```

- [ ] **Step 4: Implement outcome selector**

`src/lib/mock/outcome.ts`:

```ts
export const OUTCOME_NAMES = [
  'success', 'network_error', 'insufficient_funds', 'timeout', 'unknown_error',
] as const
export type OutcomeName = (typeof OUTCOME_NAMES)[number]

const WEIGHTED: OutcomeName[] = [
  'success', 'success', 'success', 'success', 'success', 'success',
  'network_error', 'insufficient_funds', 'timeout', 'unknown_error',
]

export function pickOutcome(forced?: string | null): OutcomeName {
  if (forced && (OUTCOME_NAMES as readonly string[]).includes(forced)) return forced as OutcomeName
  return WEIGHTED[Math.floor(Math.random() * WEIGHTED.length)]
}
```

- [ ] **Step 5: Implement in-memory store**

`src/lib/mock/data.ts` (seed data):

```ts
import { fromCents } from '@/domain/money/money'
import type { Contact } from '@/domain/contact/types'
import type { Movement } from '@/domain/movement/types'
import type { User } from '@/domain/session/types'

export const SEED_USER: User = { id: 'u1', name: 'Carlos Valenzuela' }
export const SEED_BALANCE = fromCents(125_000) // $1,250.00
export const SEED_CONTACTS: Contact[] = [
  { id: 'c1', name: 'Ana Díaz', handle: 'ana@spin.mx' },
  { id: 'c2', name: 'Luis Pérez', handle: '+52 55 1234 5678' },
]
export const SEED_MOVEMENTS: Movement[] = [
  { id: 'm1', description: 'Depósito', amountCents: fromCents(50_000), direction: 'in', createdAt: '2026-08-30T10:00:00Z' },
  { id: 'm2', description: 'Café', amountCents: fromCents(4_500), direction: 'out', createdAt: '2026-08-29T09:00:00Z' },
]
```

`src/lib/mock/store.ts`:

```ts
import type { Cents } from '@/domain/money/money'
import { fromCents } from '@/domain/money/money'
import type { Contact } from '@/domain/contact/types'
import type { Movement } from '@/domain/movement/types'
import type { Receipt } from '@/domain/transaction/types'
import { SEED_USER, SEED_BALANCE, SEED_CONTACTS, SEED_MOVEMENTS } from './data'

// In-memory singleton (survives within a running process only).
const g = globalThis as unknown as { __wallet?: WalletState }
interface WalletState {
  user: typeof SEED_USER
  balanceCents: Cents
  contacts: Contact[]
  movements: Movement[]
  receiptsByKey: Map<string, Receipt>
  seq: number
}
function state(): WalletState {
  if (!g.__wallet) {
    g.__wallet = {
      user: SEED_USER, balanceCents: SEED_BALANCE,
      contacts: [...SEED_CONTACTS], movements: [...SEED_MOVEMENTS],
      receiptsByKey: new Map(), seq: 100,
    }
  }
  return g.__wallet
}
const nextId = (p: string) => `${p}${state().seq++}`

export const store = {
  getUser: () => state().user,
  getBalanceCents: () => state().balanceCents,
  getWallet: () => ({ user: state().user, balanceCents: state().balanceCents }),
  getMovements: () => state().movements,
  listContacts: () => state().contacts,
  addContact(name: string, handle: string): Contact {
    const c: Contact = { id: nextId('c'), name, handle }
    state().contacts.unshift(c)
    return c
  },
  getReceiptByKey: (key: string) => state().receiptsByKey.get(key),
  applyTransaction(amountCents: Cents, recipient: Contact, key: string): Receipt {
    const s = state()
    const receipt: Receipt = {
      id: nextId('t'), amountCents, recipient, createdAt: new Date().toISOString(),
    }
    s.balanceCents = fromCents(s.balanceCents - amountCents)
    s.movements.unshift({
      id: nextId('m'), description: `Envío a ${recipient.name}`,
      amountCents, direction: 'out', createdAt: receipt.createdAt,
    })
    s.receiptsByKey.set(key, receipt)
    return receipt
  },
}
```

> Note: `new Date().toISOString()` runs at request time in Node (fine here — this is app runtime, not a workflow script).

- [ ] **Step 6: Run to verify pass**

Run: `npx vitest run src/lib/mock/outcome.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/domain src/lib/mock
git commit -m "feat(mock): in-memory store, latency, deterministic outcome selector"
```

---

## Task 5: Session cookie helpers + middleware guard

**Files:**
- Create: `src/lib/session.ts`, `src/middleware.ts`
- Test: `src/lib/session.test.ts`

**Interfaces:**
- Consumes: `Session`, `User`.
- Produces:
  - `SESSION_COOKIE = 'session'`
  - `encodeSession(user: User): string` and `decodeSession(token: string | undefined): User | null` (base64 JSON — mock, not secure).
  - `readSessionFromCookieHeader(header: string | null): User | null` — parses a raw `Cookie` header (testable without Next request scope).
  - `middleware` redirects unauthenticated requests for `/home` and `/transfer` to `/login`.

- [ ] **Step 1: Write failing tests**

`src/lib/session.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { encodeSession, decodeSession, readSessionFromCookieHeader, SESSION_COOKIE } from './session'

describe('session token', () => {
  it('round-trips a user', () => {
    const token = encodeSession({ id: 'u1', name: 'Carlos' })
    expect(decodeSession(token)).toEqual({ id: 'u1', name: 'Carlos' })
  })
  it('returns null for undefined', () => { expect(decodeSession(undefined)).toBeNull() })
  it('returns null for garbage', () => { expect(decodeSession('!!!')).toBeNull() })
})

describe('readSessionFromCookieHeader', () => {
  it('reads the session user from a Cookie header', () => {
    const token = encodeSession({ id: 'u1', name: 'Carlos' })
    const header = `foo=bar; ${SESSION_COOKIE}=${token}; baz=qux`
    expect(readSessionFromCookieHeader(header)).toEqual({ id: 'u1', name: 'Carlos' })
  })
  it('returns null when the cookie is absent', () => {
    expect(readSessionFromCookieHeader('foo=bar')).toBeNull()
  })
  it('returns null for a null header', () => {
    expect(readSessionFromCookieHeader(null)).toBeNull()
  })
})
```

- [ ] **Step 2: Run to verify fail**

Run: `npx vitest run src/lib/session.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement session helpers**

`src/lib/session.ts`:

```ts
import type { User } from '@/domain/session/types'

export const SESSION_COOKIE = 'session'

export function encodeSession(user: User): string {
  return Buffer.from(JSON.stringify(user), 'utf8').toString('base64url')
}

export function decodeSession(token: string | undefined): User | null {
  if (!token) return null
  try {
    const json = Buffer.from(token, 'base64url').toString('utf8')
    const parsed = JSON.parse(json) as Partial<User>
    if (typeof parsed.id === 'string' && typeof parsed.name === 'string') {
      return { id: parsed.id, name: parsed.name }
    }
    return null
  } catch {
    return null
  }
}

export function readSessionFromCookieHeader(header: string | null): User | null {
  if (!header) return null
  const prefix = `${SESSION_COOKIE}=`
  const entry = header.split(';').map((s) => s.trim()).find((s) => s.startsWith(prefix))
  if (!entry) return null
  return decodeSession(entry.slice(prefix.length))
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/lib/session.test.ts`
Expected: PASS.

- [ ] **Step 5: Implement middleware**

`src/middleware.ts`:

```ts
import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE, decodeSession } from '@/lib/session'

export function middleware(req: NextRequest) {
  const user = decodeSession(req.cookies.get(SESSION_COOKIE)?.value)
  if (!user) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = { matcher: ['/home/:path*', '/transfer/:path*'] }
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/session.ts src/lib/session.test.ts src/middleware.ts
git commit -m "feat(session): mock cookie helpers and route guard middleware"
```

---

## Task 6: zod schemas + API routes (auth, wallet, movements, contacts)

**Files:**
- Create: `src/lib/validation/schemas.ts`, `src/app/api/auth/login/route.ts`, `src/app/api/auth/logout/route.ts`, `src/app/api/wallet/route.ts`, `src/app/api/movements/route.ts`, `src/app/api/contacts/route.ts`
- Test: `src/lib/validation/schemas.test.ts`

**Interfaces:**
- Consumes: `store`, `encodeSession`, `decodeSession`, `SESSION_COOKIE`.
- Produces:
  - `loginSchema` (`{ identifier: string }` — email or phone), `contactSchema` (`{ name, handle }`), `transactionSchema` (`{ amountCents: number, recipientId?: string, newContact?: {name,handle} }`).
  - `GET /api/wallet` → `{ user, balanceCents }`
  - `GET /api/movements` → `{ movements }`
  - `GET /api/contacts` → `{ contacts }`; `POST /api/contacts` `{name,handle}` → `{ contact }`
  - `POST /api/auth/login` sets session cookie; `POST /api/auth/logout` clears it.

- [ ] **Step 1: Write failing schema tests**

`src/lib/validation/schemas.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { loginSchema } from './schemas'

describe('loginSchema', () => {
  it('accepts an email', () => { expect(loginSchema.safeParse({ identifier: 'a@b.com' }).success).toBe(true) })
  it('accepts a phone', () => { expect(loginSchema.safeParse({ identifier: '+52 55 1234 5678' }).success).toBe(true) })
  it('rejects gibberish', () => { expect(loginSchema.safeParse({ identifier: 'xx' }).success).toBe(false) })
  it('rejects empty', () => { expect(loginSchema.safeParse({ identifier: '' }).success).toBe(false) })
})
```

- [ ] **Step 2: Run to verify fail**

Run: `npx vitest run src/lib/validation/schemas.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement schemas**

`src/lib/validation/schemas.ts`:

```ts
import { z } from 'zod'

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phoneRe = /^\+?[\d\s()-]{7,}$/

export const loginSchema = z.object({
  identifier: z.string().trim().refine(
    (v) => emailRe.test(v) || phoneRe.test(v),
    { message: 'Ingresa un email o teléfono válido' },
  ),
})

export const contactSchema = z.object({
  name: z.string().trim().min(1),
  handle: z.string().trim().min(1),
})

export const transactionSchema = z.object({
  amountCents: z.number().int(),
  recipientId: z.string().optional(),
  newContact: contactSchema.optional(),
})
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/lib/validation/schemas.test.ts`
Expected: PASS.

- [ ] **Step 5: Implement auth routes**

`src/app/api/auth/login/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { loginSchema } from '@/lib/validation/schemas'
import { store } from '@/lib/mock/store'
import { SESSION_COOKIE, encodeSession } from '@/lib/session'
import { randomDelay } from '@/lib/mock/latency'
import { checkRateLimit } from '@/lib/security/rate-limit'

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? 'local'
  if (!checkRateLimit(`login:${ip}`)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }
  const body = await req.json().catch(() => null)
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 422 })
  }
  await randomDelay(400, 900)
  const user = store.getUser()
  const res = NextResponse.json({ user })
  // Set cookie on the response (testable; no request-scope dependency).
  res.cookies.set(SESSION_COOKIE, encodeSession(user), {
    httpOnly: true, secure: true, sameSite: 'lax', path: '/',
  })
  return res
}
```

`src/app/api/auth/logout/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { SESSION_COOKIE } from '@/lib/session'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete(SESSION_COOKIE)
  return res
}
```

> `checkRateLimit` comes from Task 9; until then, stub it as `export const checkRateLimit = () => true` in `src/lib/security/rate-limit.ts` so this route compiles. Task 9 replaces the stub with the real test-backed implementation.

- [ ] **Step 6: Implement wallet / movements / contacts routes**

`src/app/api/wallet/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { store } from '@/lib/mock/store'
import { randomDelay } from '@/lib/mock/latency'

export async function GET() {
  await randomDelay(200, 500)
  return NextResponse.json(store.getWallet())
}
```

`src/app/api/movements/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { store } from '@/lib/mock/store'
import { randomDelay } from '@/lib/mock/latency'

export async function GET() {
  await randomDelay(200, 500)
  return NextResponse.json({ movements: store.getMovements() })
}
```

`src/app/api/contacts/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { store } from '@/lib/mock/store'
import { contactSchema } from '@/lib/validation/schemas'

export async function GET() {
  return NextResponse.json({ contacts: store.listContacts() })
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const parsed = contactSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 422 })
  const contact = store.addContact(parsed.data.name, parsed.data.handle)
  return NextResponse.json({ contact }, { status: 201 })
}
```

- [ ] **Step 7: Typecheck + run tests**

Run: `npm test && npx tsc --noEmit`
Expected: PASS, no type errors.

- [ ] **Step 8: Commit**

```bash
git add src/lib/validation src/app/api/auth src/app/api/wallet src/app/api/movements src/app/api/contacts src/lib/security/rate-limit.ts
git commit -m "feat(api): zod schemas + auth/wallet/movements/contacts routes"
```

---

## Task 7: Transactions API route (random outcome + server-side rules + idempotency)

**Files:**
- Create: `src/app/api/transactions/route.ts`
- Test: `src/app/api/transactions/route.test.ts`

**Interfaces:**
- Consumes: `store`, `validateTransaction`, `pickOutcome`, `transactionSchema`, `decodeSession`, `randomDelay`.
- Produces: `POST /api/transactions` — reads `x-mock-outcome` and `Idempotency-Key` headers, returns a `TransactionResult` JSON. Success mutates the store; a repeat `Idempotency-Key` returns the same receipt without a second charge.

- [ ] **Step 1: Write failing route tests**

`src/app/api/transactions/route.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { POST } from './route'
import { encodeSession } from '@/lib/session'
import { store } from '@/lib/mock/store'

function req(body: unknown, headers: Record<string, string> = {}) {
  return new Request('http://localhost/api/transactions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie: `session=${encodeSession({ id: 'u1', name: 'Carlos' })}`,
      ...headers,
    },
    body: JSON.stringify(body),
  })
}

describe('POST /api/transactions', () => {
  it('returns success and charges once for a valid tx', async () => {
    const before = store.getBalanceCents()
    const res = await POST(req(
      { amountCents: 1000, recipientId: 'c1' },
      { 'x-mock-outcome': 'success', 'idempotency-key': 'k1' },
    ))
    const json = await res.json()
    expect(json.status).toBe('success')
    expect(store.getBalanceCents()).toBe(before - 1000)
  })
  it('is idempotent: same key does not double-charge', async () => {
    const balanceAfterFirst = store.getBalanceCents()
    const res = await POST(req(
      { amountCents: 1000, recipientId: 'c1' },
      { 'x-mock-outcome': 'success', 'idempotency-key': 'k1' },
    ))
    const json = await res.json()
    expect(json.status).toBe('success')
    expect(store.getBalanceCents()).toBe(balanceAfterFirst) // unchanged
  })
  it('rejects an over-balance amount with insufficient_funds (422)', async () => {
    const res = await POST(req(
      { amountCents: 99_999_999, recipientId: 'c1' },
      { 'idempotency-key': 'k2' },
    ))
    expect(res.status).toBe(422)
    const json = await res.json()
    expect(json.status).toBe('insufficient_funds')
  })
  it('forces a network_error outcome without charging', async () => {
    const before = store.getBalanceCents()
    const res = await POST(req(
      { amountCents: 1000, recipientId: 'c1' },
      { 'x-mock-outcome': 'network_error', 'idempotency-key': 'k3' },
    ))
    const json = await res.json()
    expect(json.status).toBe('network_error')
    expect(store.getBalanceCents()).toBe(before)
  })
})
```

- [ ] **Step 2: Run to verify fail**

Run: `npx vitest run src/app/api/transactions/route.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement the route**

`src/app/api/transactions/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { transactionSchema } from '@/lib/validation/schemas'
import { store } from '@/lib/mock/store'
import { fromCents } from '@/domain/money/money'
import { validateTransaction } from '@/domain/transaction/rules'
import type { TransactionResult } from '@/domain/transaction/types'
import { pickOutcome } from '@/lib/mock/outcome'
import { randomDelay } from '@/lib/mock/latency'
import { readSessionFromCookieHeader } from '@/lib/session'

export async function POST(req: Request) {
  const user = readSessionFromCookieHeader(req.headers.get('cookie'))
  if (!user) return NextResponse.json({ status: 'unknown_error' }, { status: 401 })

  const key = req.headers.get('idempotency-key')
  if (!key) return NextResponse.json({ error: 'missing_idempotency_key' }, { status: 400 })

  // Idempotent replay: return the stored receipt without charging again.
  const existing = store.getReceiptByKey(key)
  if (existing) {
    return NextResponse.json({ status: 'success', receipt: existing } satisfies TransactionResult)
  }

  const body = await req.json().catch(() => null)
  const parsed = transactionSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ status: 'unknown_error' }, { status: 422 })

  // Resolve recipient (existing favorite or newly-saved contact).
  const { amountCents, recipientId, newContact } = parsed.data
  const recipient = newContact
    ? store.addContact(newContact.name, newContact.handle)
    : store.listContacts().find((c) => c.id === recipientId) ?? null

  // Server-side re-validation (never trust the client).
  const check = validateTransaction(
    { amountCents: fromCents(amountCents), recipient },
    { balanceCents: store.getBalanceCents() },
  )
  if (!check.ok) {
    const insufficient = check.errors.some((e) => e.code === 'insufficient_balance')
    const status: TransactionResult['status'] = insufficient ? 'insufficient_funds' : 'unknown_error'
    return NextResponse.json({ status } satisfies TransactionResult, { status: 422 })
  }

  // Simulate the random confirmation behavior.
  const outcome = pickOutcome(req.headers.get('x-mock-outcome'))
  if (outcome === 'timeout') { await randomDelay(9000, 12000) }

  if (outcome !== 'success') {
    const code = outcome === 'insufficient_funds' ? 422 : 502
    return NextResponse.json({ status: outcome } satisfies TransactionResult, { status: code })
  }

  await randomDelay(300, 700)
  const receipt = store.applyTransaction(check.input.amountCents, check.input.recipient, key)
  return NextResponse.json({ status: 'success', receipt } satisfies TransactionResult)
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/app/api/transactions/route.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/transactions
git commit -m "feat(api): transactions route with server rules, idempotency, random outcome"
```

---

## Task 8: API client + TanStack Query hooks

**Files:**
- Create: `src/lib/api-client.ts`, `src/app/providers.tsx`, `src/hooks/use-wallet.ts`, `src/hooks/use-movements.ts`, `src/hooks/use-contacts.ts`, `src/hooks/use-create-transaction.ts`
- Test: `src/hooks/use-create-transaction.test.tsx`

**Interfaces:**
- Consumes: API routes, `TransactionResult`, `Cents`, `Contact`.
- Produces:
  - `apiClient` — typed `get`/`post` wrappers throwing `ApiError` on non-2xx (except transaction outcomes, which are returned as data).
  - `useWallet()`, `useMovements()`, `useContacts()` queries; `useCreateTransaction()` mutation returning `TransactionResult` and generating a stable `Idempotency-Key` per attempt, with `retry` using backoff.
  - `Providers` wrapping children in `QueryClientProvider`.

- [ ] **Step 1: Write failing hook test**

`src/hooks/use-create-transaction.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useCreateTransaction } from './use-create-transaction'
import type { ReactNode } from 'react'

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () =>
    new Response(JSON.stringify({ status: 'network_error' }), { status: 502 }),
  ))
})

describe('useCreateTransaction', () => {
  it('maps a non-success HTTP body to a TransactionResult', async () => {
    const { result } = renderHook(() => useCreateTransaction(), { wrapper })
    result.current.mutate({ amountCents: 1000, recipientId: 'c1' })
    await waitFor(() => expect(result.current.data?.status).toBe('network_error'))
  })
})
```

- [ ] **Step 2: Run to verify fail**

Run: `npx vitest run src/hooks/use-create-transaction.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement api-client**

`src/lib/api-client.ts`:

```ts
export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) throw new ApiError(res.status, `Request failed: ${res.status}`)
  return res.json() as Promise<T>
}

export const apiClient = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, body: unknown, headers?: Record<string, string>) =>
    request<T>(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
    }),
  raw: (url: string, init?: RequestInit) => fetch(url, init),
}
```

- [ ] **Step 4: Implement query hooks + providers**

`src/app/providers.tsx`:

```tsx
'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  const [qc] = useState(() => new QueryClient())
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}
```

`src/hooks/use-wallet.ts`:

```ts
'use client'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { Cents } from '@/domain/money/money'
import type { User } from '@/domain/session/types'

interface WalletDto { user: User; balanceCents: Cents }
export function useWallet(initialData?: WalletDto) {
  return useQuery({
    queryKey: ['wallet'],
    queryFn: () => apiClient.get<WalletDto>('/api/wallet'),
    initialData,
  })
}
```

`src/hooks/use-movements.ts`:

```ts
'use client'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { Movement } from '@/domain/movement/types'

export function useMovements(initialData?: { movements: Movement[] }) {
  return useQuery({
    queryKey: ['movements'],
    queryFn: () => apiClient.get<{ movements: Movement[] }>('/api/movements'),
    initialData,
  })
}
```

`src/hooks/use-contacts.ts`:

```ts
'use client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { Contact } from '@/domain/contact/types'

export function useContacts() {
  return useQuery({
    queryKey: ['contacts'],
    queryFn: () => apiClient.get<{ contacts: Contact[] }>('/api/contacts'),
  })
}
export function useAddContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { name: string; handle: string }) =>
      apiClient.post<{ contact: Contact }>('/api/contacts', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts'] }),
  })
}
```

- [ ] **Step 5: Implement create-transaction mutation**

`src/hooks/use-create-transaction.ts`:

```ts
'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { TransactionResult } from '@/domain/transaction/types'

export interface TransferPayload {
  amountCents: number
  recipientId?: string
  newContact?: { name: string; handle: string }
  forcedOutcome?: string
}

// A stable idempotency key per user attempt; regenerated only for a fresh attempt.
function newKey(): string {
  return `txn_${Date.now()}_${Math.floor(Math.random() * 1e6)}`
}

export function useCreateTransaction() {
  const qc = useQueryClient()
  return useMutation<TransactionResult, Error, TransferPayload & { idempotencyKey?: string }>({
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 4000) + Math.random() * 200,
    mutationFn: async (payload) => {
      const key = payload.idempotencyKey ?? newKey()
      const headers: Record<string, string> = { 'idempotency-key': key }
      if (payload.forcedOutcome) headers['x-mock-outcome'] = payload.forcedOutcome
      const res = await apiClient.raw('/api/transactions', {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...headers },
        body: JSON.stringify(payload),
      })
      return (await res.json()) as TransactionResult
    },
    onSuccess: (result) => {
      if (result.status === 'success') {
        qc.invalidateQueries({ queryKey: ['wallet'] })
        qc.invalidateQueries({ queryKey: ['movements'] })
      }
    },
  })
}
```

- [ ] **Step 6: Run to verify pass**

Run: `npx vitest run src/hooks/use-create-transaction.test.tsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/api-client.ts src/app/providers.tsx src/hooks
git commit -m "feat(hooks): api client + TanStack Query hooks with idempotency/backoff"
```

---

## Task 9: Security — rate limiter + headers

**Files:**
- Create: `src/lib/security/rate-limit.ts` (replace stub), `src/lib/security/headers.ts`
- Modify: `next.config.ts` (add `headers()`)
- Test: `src/lib/security/rate-limit.test.ts`

**Interfaces:**
- Produces:
  - `checkRateLimit(key: string, opts?: { limit?: number; windowMs?: number }): boolean` — in-memory sliding counter; returns `false` when over the limit.
  - `SECURITY_HEADERS: { key: string; value: string }[]` used by `next.config`.

- [ ] **Step 1: Write failing tests**

`src/lib/security/rate-limit.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { checkRateLimit } from './rate-limit'

describe('checkRateLimit', () => {
  it('allows up to the limit then blocks', () => {
    const key = 'test-key'
    const opts = { limit: 3, windowMs: 60_000 }
    expect(checkRateLimit(key, opts)).toBe(true)
    expect(checkRateLimit(key, opts)).toBe(true)
    expect(checkRateLimit(key, opts)).toBe(true)
    expect(checkRateLimit(key, opts)).toBe(false)
  })
})
```

- [ ] **Step 2: Run to verify fail**

Run: `npx vitest run src/lib/security/rate-limit.test.ts`
Expected: FAIL (stub always returns true).

- [ ] **Step 3: Implement rate limiter**

`src/lib/security/rate-limit.ts`:

```ts
const hits = new Map<string, number[]>()

export function checkRateLimit(
  key: string,
  opts: { limit?: number; windowMs?: number } = {},
): boolean {
  const limit = opts.limit ?? 5
  const windowMs = opts.windowMs ?? 60_000
  const now = Date.now()
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
  if (recent.length >= limit) { hits.set(key, recent); return false }
  recent.push(now)
  hits.set(key, recent)
  return true
}
```

- [ ] **Step 4: Implement headers + wire into next.config**

`src/lib/security/headers.ts`:

```ts
export const SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'",
  },
]
```

Update `next.config.ts`:

```ts
import type { NextConfig } from 'next'
import { SECURITY_HEADERS } from './src/lib/security/headers'

const nextConfig: NextConfig = {
  output: 'standalone',
  async headers() {
    return [{ source: '/:path*', headers: SECURITY_HEADERS }]
  },
}
export default nextConfig
```

- [ ] **Step 5: Run to verify pass**

Run: `npx vitest run src/lib/security/rate-limit.test.ts && npx tsc --noEmit`
Expected: PASS, no type errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/security next.config.ts
git commit -m "feat(security): in-memory rate limiter + security headers"
```

---

## Task 10: Session store + login page

**Files:**
- Create: `src/stores/session-store.ts`, `src/app/(auth)/login/page.tsx`, `src/components/feature/login-form.tsx`
- Modify: `src/app/layout.tsx` (mount `Providers`, apply Poseidon theme on `<html>`)
- Test: `src/hooks/use-login.test.tsx`, and create `src/hooks/use-login.ts`

**Interfaces:**
- Consumes: `apiClient`, `loginSchema` shape, `User`.
- Produces:
  - `useSessionStore` (Zustand persist) — `{ user: User | null; setUser; clear }`.
  - `useLogin()` — validates the identifier client-side, calls `POST /api/auth/login`, stores the user, exposes `{ submit, isPending, error }`.
  - `LoginForm` (presentational): props `{ value, onChange, onSubmit, isPending, error }`.

- [ ] **Step 1: Write failing hook test**

`src/hooks/use-login.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useLogin } from './use-login'
import type { ReactNode } from 'react'

const wrapper = ({ children }: { children: ReactNode }) => {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('useLogin', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () =>
      new Response(JSON.stringify({ user: { id: 'u1', name: 'Carlos' } }), { status: 200 })))
  })
  it('rejects an invalid identifier without calling the API', async () => {
    const { result } = renderHook(() => useLogin(), { wrapper })
    await act(async () => { await result.current.submit('xx') })
    expect(result.current.error).toBeTruthy()
    expect(fetch).not.toHaveBeenCalled()
  })
  it('logs in with a valid email', async () => {
    const { result } = renderHook(() => useLogin(), { wrapper })
    await act(async () => { await result.current.submit('a@b.com') })
    await waitFor(() => expect(fetch).toHaveBeenCalled())
  })
})
```

- [ ] **Step 2: Run to verify fail**

Run: `npx vitest run src/hooks/use-login.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement session store**

`src/stores/session-store.ts`:

```ts
'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/domain/session/types'

interface SessionState {
  user: User | null
  setUser: (u: User) => void
  clear: () => void
}
export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({ user: null, setUser: (user) => set({ user }), clear: () => set({ user: null }) }),
    { name: 'wallet-session' },
  ),
)
```

- [ ] **Step 4: Implement useLogin hook**

`src/hooks/use-login.ts`:

```ts
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { loginSchema } from '@/lib/validation/schemas'
import { useSessionStore } from '@/stores/session-store'
import type { User } from '@/domain/session/types'

export function useLogin() {
  const router = useRouter()
  const setUser = useSessionStore((s) => s.setUser)
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (identifier: string) =>
      apiClient.post<{ user: User }>('/api/auth/login', { identifier }),
    onSuccess: ({ user }) => { setUser(user); router.push('/home') },
    onError: () => setError('No pudimos iniciar sesión. Intenta de nuevo.'),
  })

  async function submit(identifier: string) {
    setError(null)
    const parsed = loginSchema.safeParse({ identifier })
    if (!parsed.success) { setError(parsed.error.issues[0].message); return }
    await mutation.mutateAsync(identifier).catch(() => {})
  }

  return { submit, isPending: mutation.isPending, error }
}
```

- [ ] **Step 5: Run to verify pass**

Run: `npx vitest run src/hooks/use-login.test.tsx`
Expected: PASS.

- [ ] **Step 6: Implement presentational form + page + layout**

`src/components/feature/login-form.tsx`:

```tsx
'use client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Props {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  isPending: boolean
  error: string | null
}
export function LoginForm({ value, onChange, onSubmit, isPending, error }: Props) {
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit() }}
      className="mx-auto flex w-full max-w-sm flex-col gap-4"
    >
      <Input
        aria-label="Email o teléfono"
        placeholder="Email o teléfono"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Ingresando…' : 'Ingresar'}
      </Button>
    </form>
  )
}
```

`src/app/(auth)/login/page.tsx`:

```tsx
'use client'
import { useState } from 'react'
import { LoginForm } from '@/components/feature/login-form'
import { useLogin } from '@/hooks/use-login'

export default function LoginPage() {
  const [value, setValue] = useState('')
  const { submit, isPending, error } = useLogin()
  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full">
        <h1 className="mb-6 text-center text-2xl font-semibold">Spin Wallet</h1>
        <LoginForm value={value} onChange={setValue} onSubmit={() => submit(value)} isPending={isPending} error={error} />
      </div>
    </main>
  )
}
```

Update `src/app/layout.tsx` to mount providers and set the theme:

```tsx
import type { ReactNode } from 'react'
import './globals.css'
import { Providers } from './providers'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" data-theme="poseidon">
      <body><Providers>{children}</Providers></body>
    </html>
  )
}
```

- [ ] **Step 7: Manual smoke + typecheck**

Run: `npx tsc --noEmit && npm run dev`
Visit `/login`, submit `a@b.com`, confirm redirect to `/home`.

- [ ] **Step 8: Commit**

```bash
git add src/stores/session-store.ts src/hooks/use-login.ts src/hooks/use-login.test.tsx src/components/feature/login-form.tsx "src/app/(auth)" src/app/layout.tsx
git commit -m "feat(login): session store, useLogin hook, presentational form"
```

---

## Task 11: Home (SSR) + movement list + states

**Files:**
- Create: `src/app/(app)/layout.tsx`, `src/app/(app)/home/page.tsx`, `src/components/feature/home-view.tsx`, `src/components/feature/movement-list.tsx`, `src/components/feature/balance-card.tsx`, `src/components/feature/async-state.tsx`
- Modify: none

**Interfaces:**
- Consumes: `store` (server read for SSR initial data), `useWallet`, `useMovements`, `formatMoney`, `Movement`, `decodeSession`.
- Produces:
  - `(app)/layout.tsx` — server component; reads session cookie, redirects to `/login` if absent, renders a header with the user name + logout.
  - `HomeView` (presentational) — receives wallet + movements query states and renders loading/empty/error/data.
  - `AsyncState` (presentational) — renders `loading` / `empty` / `error` slots.

- [ ] **Step 1: Implement `(app)/layout.tsx` (server, SSR session)**

```tsx
import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { SESSION_COOKIE, decodeSession } from '@/lib/session'
import { LogoutButton } from '@/components/feature/logout-button'

export default async function AppLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies()
  const user = decodeSession(cookieStore.get(SESSION_COOKIE)?.value)
  if (!user) redirect('/login')
  return (
    <div className="min-h-dvh">
      <header className="flex items-center justify-between border-b p-4">
        <span className="font-semibold">Hola, {user.name}</span>
        <LogoutButton />
      </header>
      <main className="p-4">{children}</main>
    </div>
  )
}
```

- [ ] **Step 2: Implement logout button + home page (SSR fetch → hydrate)**

`src/components/feature/logout-button.tsx`:

```tsx
'use client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/lib/api-client'
import { useSessionStore } from '@/stores/session-store'

export function LogoutButton() {
  const router = useRouter()
  const clear = useSessionStore((s) => s.clear)
  async function logout() {
    await apiClient.post('/api/auth/logout', {})
    clear()
    router.push('/login')
  }
  return <Button variant="outline" onClick={logout}>Salir</Button>
}
```

`src/app/(app)/home/page.tsx` (server component reads seed data for SSR initial render):

```tsx
import { store } from '@/lib/mock/store'
import { HomeView } from '@/components/feature/home-view'

export default function HomePage() {
  const wallet = store.getWallet()
  const movements = store.getMovements()
  return <HomeView initialWallet={wallet} initialMovements={movements} />
}
```

- [ ] **Step 3: Implement presentational AsyncState + MovementList + BalanceCard + HomeView**

`src/components/feature/async-state.tsx`:

```tsx
import type { ReactNode } from 'react'

interface Props {
  isLoading: boolean
  isError: boolean
  isEmpty: boolean
  loading?: ReactNode
  error?: ReactNode
  empty?: ReactNode
  children: ReactNode
}
export function AsyncState({ isLoading, isError, isEmpty, loading, error, empty, children }: Props) {
  if (isLoading) return <>{loading ?? <p>Cargando…</p>}</>
  if (isError) return <>{error ?? <p role="alert">Ocurrió un error.</p>}</>
  if (isEmpty) return <>{empty ?? <p>Sin datos.</p>}</>
  return <>{children}</>
}
```

`src/components/feature/balance-card.tsx`:

```tsx
import { formatMoney, type Cents } from '@/domain/money/money'
import { Card } from '@/components/ui/card'

export function BalanceCard({ name, balanceCents }: { name: string; balanceCents: Cents }) {
  return (
    <Card className="p-6">
      <p className="text-sm opacity-70">Saldo disponible</p>
      <p className="text-3xl font-bold">{formatMoney(balanceCents)}</p>
      <p className="mt-1 text-sm opacity-70">{name}</p>
    </Card>
  )
}
```

`src/components/feature/movement-list.tsx`:

```tsx
import { formatMoney } from '@/domain/money/money'
import type { Movement } from '@/domain/movement/types'

export function MovementList({ movements }: { movements: Movement[] }) {
  return (
    <ul className="divide-y" data-testid="movement-list">
      {movements.map((m) => (
        <li key={m.id} className="flex justify-between py-3">
          <span>{m.description}</span>
          <span className={m.direction === 'in' ? 'text-emerald-400' : 'text-red-400'}>
            {m.direction === 'in' ? '+' : '−'}{formatMoney(m.amountCents)}
          </span>
        </li>
      ))}
    </ul>
  )
}
```

`src/components/feature/home-view.tsx`:

```tsx
'use client'
import Link from 'next/link'
import { useWallet } from '@/hooks/use-wallet'
import { useMovements } from '@/hooks/use-movements'
import { BalanceCard } from './balance-card'
import { MovementList } from './movement-list'
import { AsyncState } from './async-state'
import { Button } from '@/components/ui/button'
import type { Cents } from '@/domain/money/money'
import type { User } from '@/domain/session/types'
import type { Movement } from '@/domain/movement/types'

interface Props {
  initialWallet: { user: User; balanceCents: Cents }
  initialMovements: Movement[]
}
export function HomeView({ initialWallet, initialMovements }: Props) {
  const wallet = useWallet(initialWallet)
  const movements = useMovements({ movements: initialMovements })
  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      {wallet.data && <BalanceCard name={wallet.data.user.name} balanceCents={wallet.data.balanceCents} />}
      <Button asChild><Link href="/transfer">Nueva transacción</Link></Button>
      <section>
        <h2 className="mb-2 font-semibold">Movimientos recientes</h2>
        <AsyncState
          isLoading={movements.isLoading}
          isError={movements.isError}
          isEmpty={!!movements.data && movements.data.movements.length === 0}
          empty={<p>Aún no tienes movimientos.</p>}
        >
          {movements.data && <MovementList movements={movements.data.movements} />}
        </AsyncState>
      </section>
    </div>
  )
}
```

- [ ] **Step 4: Manual smoke + typecheck**

Run: `npx tsc --noEmit && npm run dev`
Visit `/home` (after login). Confirm balance, movements, and the "Nueva transacción" button.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(app)" src/components/feature
git commit -m "feat(home): SSR home with balance, movements, async states, logout"
```

---

## Task 12: Transfer wizard (amount → recipient → summary → confirm → receipt)

**Files:**
- Create: `src/app/(app)/transfer/page.tsx`, `src/stores/transfer-store.ts`, `src/hooks/use-transfer-form.ts`, `src/components/feature/amount-input.tsx`, `src/components/feature/contact-picker.tsx`, `src/components/feature/transfer-summary.tsx`, `src/components/feature/receipt-view.tsx`, `src/components/feature/error-state.tsx`, `src/components/feature/transfer-wizard.tsx`
- Test: `src/hooks/use-transfer-form.test.tsx`

**Interfaces:**
- Consumes: `validateTransaction`, `toCents`, `formatMoney`, `useContacts`, `useAddContact`, `useCreateTransaction`, `useWallet`, `Contact`, `TransactionResult`.
- Produces:
  - `useTransferStore` — `{ step, amountRaw, recipient, setAmountRaw, setRecipient, next, back, reset }`.
  - `useTransferForm(balanceCents)` — parses `amountRaw` to cents, runs `validateTransaction`, returns `{ amountCents, errors, isValid }`.
  - Presentational: `AmountInput`, `ContactPicker`, `TransferSummary`, `ReceiptView`, `ErrorState`.

- [ ] **Step 1: Write failing test for useTransferForm**

`src/hooks/use-transfer-form.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useTransferForm } from './use-transfer-form'
import { fromCents } from '@/domain/money/money'

const contact = { id: 'c1', name: 'Ana', handle: 'ana@x.com' }
const balance = fromCents(10000)

describe('useTransferForm', () => {
  it('is invalid with an empty amount', () => {
    const { result } = renderHook(() => useTransferForm({ amountRaw: '', recipient: contact, balanceCents: balance }))
    expect(result.current.isValid).toBe(false)
  })
  it('is invalid over balance', () => {
    const { result } = renderHook(() => useTransferForm({ amountRaw: '200', recipient: contact, balanceCents: balance }))
    expect(result.current.errors).toContainEqual({ code: 'insufficient_balance' })
  })
  it('is valid with amount within balance and a recipient', () => {
    const { result } = renderHook(() => useTransferForm({ amountRaw: '50', recipient: contact, balanceCents: balance }))
    expect(result.current.isValid).toBe(true)
    expect(result.current.amountCents).toBe(5000)
  })
})
```

- [ ] **Step 2: Run to verify fail**

Run: `npx vitest run src/hooks/use-transfer-form.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement transfer store + form hook**

`src/stores/transfer-store.ts`:

```ts
'use client'
import { create } from 'zustand'
import type { Contact } from '@/domain/contact/types'

type Step = 'amount' | 'recipient' | 'summary' | 'result'
interface TransferState {
  step: Step
  amountRaw: string
  recipient: Contact | null
  setAmountRaw: (v: string) => void
  setRecipient: (c: Contact | null) => void
  goto: (s: Step) => void
  reset: () => void
}
export const useTransferStore = create<TransferState>((set) => ({
  step: 'amount', amountRaw: '', recipient: null,
  setAmountRaw: (amountRaw) => set({ amountRaw }),
  setRecipient: (recipient) => set({ recipient }),
  goto: (step) => set({ step }),
  reset: () => set({ step: 'amount', amountRaw: '', recipient: null }),
}))
```

`src/hooks/use-transfer-form.ts`:

```ts
'use client'
import { toCents, type Cents } from '@/domain/money/money'
import { validateTransaction } from '@/domain/transaction/rules'
import type { Contact } from '@/domain/contact/types'
import type { ValidationError } from '@/domain/transaction/types'

export function useTransferForm(input: {
  amountRaw: string
  recipient: Contact | null
  balanceCents: Cents
}): { amountCents: Cents | null; errors: ValidationError[]; isValid: boolean } {
  const amountCents = input.amountRaw.trim() === '' ? null : toCents(input.amountRaw)
  const result = validateTransaction(
    { amountCents, recipient: input.recipient },
    { balanceCents: input.balanceCents },
  )
  return {
    amountCents,
    errors: result.ok ? [] : result.errors,
    isValid: result.ok,
  }
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/hooks/use-transfer-form.test.tsx`
Expected: PASS.

- [ ] **Step 5: Implement presentational components**

`src/components/feature/amount-input.tsx`:

```tsx
'use client'
import { Input } from '@/components/ui/input'

export function AmountInput({ value, onChange, error }: {
  value: string; onChange: (v: string) => void; error?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm opacity-70" htmlFor="amount">Monto</label>
      <Input id="amount" inputMode="decimal" placeholder="0.00" value={value}
        onChange={(e) => onChange(e.target.value)} />
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
    </div>
  )
}
```

`src/components/feature/contact-picker.tsx`:

```tsx
'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Contact } from '@/domain/contact/types'

export function ContactPicker({ contacts, selectedId, onSelect, onCreate }: {
  contacts: Contact[]
  selectedId: string | null
  onSelect: (c: Contact) => void
  onCreate: (name: string, handle: string) => void
}) {
  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2" data-testid="contact-list">
        {contacts.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              aria-pressed={selectedId === c.id}
              onClick={() => onSelect(c)}
              className={`w-full rounded border p-2 text-left ${selectedId === c.id ? 'border-cyan-400' : ''}`}
            >
              {c.name} <span className="opacity-60">{c.handle}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-2 border-t pt-3">
        <p className="text-sm opacity-70">Nuevo contacto</p>
        <Input placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="Email o teléfono" value={handle} onChange={(e) => setHandle(e.target.value)} />
        <Button type="button" variant="outline"
          disabled={!name.trim() || !handle.trim()}
          onClick={() => onCreate(name.trim(), handle.trim())}>
          Guardar y seleccionar
        </Button>
      </div>
    </div>
  )
}
```

`src/components/feature/transfer-summary.tsx`:

```tsx
import { formatMoney, type Cents } from '@/domain/money/money'
import type { Contact } from '@/domain/contact/types'
import { Button } from '@/components/ui/button'

export function TransferSummary({ amountCents, recipient, balanceAfterCents, onConfirm, onBack, isPending, canConfirm }: {
  amountCents: Cents; recipient: Contact; balanceAfterCents: Cents
  onConfirm: () => void; onBack: () => void; isPending: boolean; canConfirm: boolean
}) {
  return (
    <div className="flex flex-col gap-3">
      <p>Enviarás <strong>{formatMoney(amountCents)}</strong> a <strong>{recipient.name}</strong></p>
      <p className="opacity-70">Saldo después: {formatMoney(balanceAfterCents)}</p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack} disabled={isPending}>Atrás</Button>
        <Button onClick={onConfirm} disabled={!canConfirm || isPending}>
          {isPending ? 'Confirmando…' : 'Confirmar'}
        </Button>
      </div>
    </div>
  )
}
```

`src/components/feature/error-state.tsx`:

```tsx
import { Button } from '@/components/ui/button'

const MESSAGES: Record<string, string> = {
  network_error: 'Problema de red. Verifica tu conexión.',
  timeout: 'La operación tardó demasiado.',
  insufficient_funds: 'Fondos insuficientes para esta transacción.',
  unknown_error: 'Algo salió mal. Intenta más tarde.',
}
export function ErrorState({ status, onRetry }: { status: string; onRetry?: () => void }) {
  const retryable = status === 'network_error' || status === 'timeout'
  return (
    <div className="flex flex-col items-center gap-3" role="alert">
      <p>{MESSAGES[status] ?? MESSAGES.unknown_error}</p>
      {retryable && onRetry && <Button onClick={onRetry}>Reintentar</Button>}
    </div>
  )
}
```

`src/components/feature/receipt-view.tsx`:

```tsx
import Link from 'next/link'
import { formatMoney } from '@/domain/money/money'
import type { Receipt } from '@/domain/transaction/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function ReceiptView({ receipt }: { receipt: Receipt }) {
  return (
    <Card className="flex flex-col items-center gap-2 p-6" data-testid="receipt">
      <p className="text-lg font-semibold text-cyan-400">¡Transacción exitosa!</p>
      <p className="text-2xl font-bold">{formatMoney(receipt.amountCents)}</p>
      <p className="opacity-70">Para {receipt.recipient.name}</p>
      <p className="text-xs opacity-50">ID: {receipt.id}</p>
      <Button asChild className="mt-2"><Link href="/home">Volver al inicio</Link></Button>
    </Card>
  )
}
```

- [ ] **Step 6: Implement the wizard orchestrator + page**

`src/components/feature/transfer-wizard.tsx`:

```tsx
'use client'
import { useState } from 'react'
import { useWallet } from '@/hooks/use-wallet'
import { useContacts, useAddContact } from '@/hooks/use-contacts'
import { useCreateTransaction } from '@/hooks/use-create-transaction'
import { useTransferStore } from '@/stores/transfer-store'
import { useTransferForm } from '@/hooks/use-transfer-form'
import { fromCents, type Cents } from '@/domain/money/money'
import { AmountInput } from './amount-input'
import { ContactPicker } from './contact-picker'
import { TransferSummary } from './transfer-summary'
import { ReceiptView } from './receipt-view'
import { ErrorState } from './error-state'
import { AsyncState } from './async-state'
import { Button } from '@/components/ui/button'
import type { TransactionResult } from '@/domain/transaction/types'

const ERROR_CODE_MESSAGES: Record<string, string> = {
  amount_required: 'Ingresa un monto.',
  amount_not_positive: 'El monto debe ser mayor a cero.',
  insufficient_balance: 'El monto supera tu saldo.',
}

export function TransferWizard() {
  const wallet = useWallet()
  const balance = wallet.data?.balanceCents ?? fromCents(0)
  const { step, amountRaw, recipient, setAmountRaw, setRecipient, goto, reset } = useTransferStore()
  const form = useTransferForm({ amountRaw, recipient, balanceCents: balance })
  const contacts = useContacts()
  const addContact = useAddContact()
  const createTx = useCreateTransaction()
  const [result, setResult] = useState<TransactionResult | null>(null)
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null)

  const amountError = form.errors.find((e) => e.code !== 'recipient_required')
  const amountErrorMsg = amountError ? ERROR_CODE_MESSAGES[amountError.code] : undefined

  async function confirm() {
    const key = idempotencyKey ?? `txn_${Date.now()}_${Math.floor(Math.random() * 1e6)}`
    setIdempotencyKey(key)
    const res = await createTx.mutateAsync({
      amountCents: form.amountCents ?? 0,
      recipientId: recipient?.id,
      idempotencyKey: key,
    })
    setResult(res)
    goto('result')
  }

  function retry() { void confirm() }

  if (step === 'amount') {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <AmountInput value={amountRaw} onChange={setAmountRaw} error={amountRaw ? amountErrorMsg : undefined} />
        <Button disabled={!!amountErrorMsg || amountRaw.trim() === ''} onClick={() => goto('recipient')}>Continuar</Button>
      </div>
    )
  }
  if (step === 'recipient') {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <AsyncState isLoading={contacts.isLoading} isError={contacts.isError} isEmpty={false}>
          {contacts.data && (
            <ContactPicker
              contacts={contacts.data.contacts}
              selectedId={recipient?.id ?? null}
              onSelect={setRecipient}
              onCreate={async (name, handle) => {
                const { contact } = await addContact.mutateAsync({ name, handle })
                setRecipient(contact)
              }}
            />
          )}
        </AsyncState>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => goto('amount')}>Atrás</Button>
          <Button disabled={!recipient} onClick={() => goto('summary')}>Continuar</Button>
        </div>
      </div>
    )
  }
  if (step === 'summary' && recipient && form.amountCents !== null) {
    return (
      <div className="mx-auto max-w-md">
        <TransferSummary
          amountCents={form.amountCents}
          recipient={recipient}
          balanceAfterCents={fromCents(balance - form.amountCents) as Cents}
          onConfirm={confirm}
          onBack={() => goto('recipient')}
          isPending={createTx.isPending}
          canConfirm={form.isValid}
        />
      </div>
    )
  }
  if (step === 'result' && result) {
    return (
      <div className="mx-auto max-w-md">
        {result.status === 'success'
          ? <ReceiptView receipt={result.receipt} />
          : <ErrorState status={result.status} onRetry={retry} />}
        <Button variant="ghost" className="mt-4" onClick={reset}>Nueva transacción</Button>
      </div>
    )
  }
  return null
}
```

`src/app/(app)/transfer/page.tsx`:

```tsx
'use client'
import { TransferWizard } from '@/components/feature/transfer-wizard'
export default function TransferPage() { return <TransferWizard /> }
```

- [ ] **Step 7: Run tests + typecheck**

Run: `npm test && npx tsc --noEmit`
Expected: PASS, no type errors.

- [ ] **Step 8: Manual smoke**

Run: `npm run dev` → login → home → nueva transacción → complete a transfer → see receipt.

- [ ] **Step 9: Commit**

```bash
git add "src/app/(app)/transfer" src/stores/transfer-store.ts src/hooks/use-transfer-form.ts src/hooks/use-transfer-form.test.tsx src/components/feature
git commit -m "feat(transfer): wizard with amount, contacts, summary, receipt, error states"
```

---

## Task 13: Demo reset button (clear cookies + mock data)

**Files:**
- Create: `src/app/api/dev/reset/route.ts`, `src/hooks/use-reset-demo.ts`, `src/components/feature/reset-demo-button.tsx`
- Modify: `src/lib/mock/store.ts` (add `reset()`), `src/app/(app)/layout.tsx` (button in header), `src/app/(auth)/login/page.tsx` (button in footer)
- Test: `src/app/api/dev/reset/route.test.ts`

**Interfaces:**
- Consumes: `store`, `SESSION_COOKIE`, `SEED_BALANCE`.
- Produces:
  - `store.reset(): void` — restores the in-memory singleton to seed state.
  - `POST /api/dev/reset` — resets the store and clears the session cookie; gated by `ALLOW_DEMO_RESET !== 'false'` (returns 403 when disabled).
  - `useResetDemo()` — calls the route, clears the session store, redirects to `/login`.
  - `ResetDemoButton` (presentational) with an `onReset` prop.

- [ ] **Step 1: Add `reset()` to the store**

In `src/lib/mock/store.ts`, add to the `store` object:

```ts
  reset() { g.__wallet = undefined },
```

(Next access to `state()` re-seeds from `SEED_*`.)

- [ ] **Step 2: Write failing route test**

`src/app/api/dev/reset/route.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { POST } from './route'
import { store } from '@/lib/mock/store'
import { SEED_BALANCE } from '@/lib/mock/data'
import { fromCents } from '@/domain/money/money'

describe('POST /api/dev/reset', () => {
  it('restores the store to seed balance', async () => {
    const recipient = store.listContacts()[0]
    store.applyTransaction(fromCents(500), recipient, 'reset-test-key')
    expect(store.getBalanceCents()).not.toBe(SEED_BALANCE)

    const res = await POST()
    expect(res.status).toBe(200)
    expect((await res.json()).ok).toBe(true)
    expect(store.getBalanceCents()).toBe(SEED_BALANCE)
  })
})
```

- [ ] **Step 3: Run to verify fail**

Run: `npx vitest run src/app/api/dev/reset/route.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 4: Implement the reset route**

`src/app/api/dev/reset/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { store } from '@/lib/mock/store'
import { SESSION_COOKIE } from '@/lib/session'

export async function POST() {
  if (process.env.ALLOW_DEMO_RESET === 'false') {
    return NextResponse.json({ error: 'disabled' }, { status: 403 })
  }
  store.reset()
  const res = NextResponse.json({ ok: true })
  res.cookies.delete(SESSION_COOKIE)
  return res
}
```

- [ ] **Step 5: Run to verify pass**

Run: `npx vitest run src/app/api/dev/reset/route.test.ts`
Expected: PASS.

- [ ] **Step 6: Implement hook + presentational button**

`src/hooks/use-reset-demo.ts`:

```ts
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useSessionStore } from '@/stores/session-store'

export function useResetDemo() {
  const router = useRouter()
  const qc = useQueryClient()
  const clear = useSessionStore((s) => s.clear)
  const [isPending, setPending] = useState(false)

  async function reset() {
    setPending(true)
    try {
      await apiClient.post('/api/dev/reset', {})
      clear()
      qc.clear()
      router.push('/login')
      router.refresh()
    } finally {
      setPending(false)
    }
  }
  return { reset, isPending }
}
```

`src/components/feature/reset-demo-button.tsx`:

```tsx
'use client'
import { Button } from '@/components/ui/button'

export function ResetDemoButton({ onReset, isPending }: { onReset: () => void; isPending: boolean }) {
  return (
    <Button variant="ghost" size="sm" onClick={onReset} disabled={isPending} title="Reinicia datos, mocks y sesión">
      {isPending ? 'Reiniciando…' : 'Reiniciar demo'}
    </Button>
  )
}
```

- [ ] **Step 7: Wire the button into the app header and the login page**

In `src/app/(app)/layout.tsx`, add a small client wrapper next to `LogoutButton`. Create `src/components/feature/reset-demo-control.tsx`:

```tsx
'use client'
import { ResetDemoButton } from './reset-demo-button'
import { useResetDemo } from '@/hooks/use-reset-demo'

export function ResetDemoControl() {
  const { reset, isPending } = useResetDemo()
  return <ResetDemoButton onReset={reset} isPending={isPending} />
}
```

Then render `<ResetDemoControl />` in the header (next to `<LogoutButton />`) and at the bottom of the login page (`src/app/(auth)/login/page.tsx`), e.g.:

```tsx
// inside login page, below the form container
<div className="mt-6 text-center"><ResetDemoControl /></div>
```

- [ ] **Step 8: Typecheck + tests**

Run: `npm test && npx tsc --noEmit`
Expected: PASS, no type errors.

- [ ] **Step 9: Commit**

```bash
git add src/app/api/dev src/hooks/use-reset-demo.ts src/components/feature/reset-demo-button.tsx src/components/feature/reset-demo-control.tsx src/lib/mock/store.ts "src/app/(app)/layout.tsx" "src/app/(auth)/login/page.tsx"
git commit -m "feat(demo): reset button to clear cookies, mock data, and session"
```

---

## Task 14: E2E tests (Playwright)

**Files:**
- Create: `tests/e2e/wallet.spec.ts`

**Interfaces:**
- Consumes: the running app + `x-mock-outcome` via route interception.

- [ ] **Step 1: Write happy-path + guard + error specs**

`tests/e2e/wallet.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

test('redirects unauthenticated user from /home to /login', async ({ page }) => {
  await page.goto('/home')
  await expect(page).toHaveURL(/\/login/)
})

test('login → home shows balance and movements', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email o teléfono').fill('carlos@spin.mx')
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page).toHaveURL(/\/home/)
  await expect(page.getByText('Saldo disponible')).toBeVisible()
  await expect(page.getByTestId('movement-list')).toBeVisible()
})

test('happy path transfer shows a receipt', async ({ page }) => {
  // Force a success outcome deterministically.
  await page.route('**/api/transactions', async (route) => {
    const headers = { ...route.request().headers(), 'x-mock-outcome': 'success' }
    await route.continue({ headers })
  })
  await page.goto('/login')
  await page.getByLabel('Email o teléfono').fill('carlos@spin.mx')
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await page.getByRole('link', { name: 'Nueva transacción' }).click()
  await page.getByLabel('Monto').fill('10')
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.getByTestId('contact-list').getByRole('button').first().click()
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.getByRole('button', { name: 'Confirmar' }).click()
  await expect(page.getByTestId('receipt')).toBeVisible()
})

test('network error shows retry option', async ({ page }) => {
  await page.route('**/api/transactions', async (route) => {
    const headers = { ...route.request().headers(), 'x-mock-outcome': 'network_error' }
    await route.continue({ headers })
  })
  await page.goto('/login')
  await page.getByLabel('Email o teléfono').fill('carlos@spin.mx')
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await page.getByRole('link', { name: 'Nueva transacción' }).click()
  await page.getByLabel('Monto').fill('10')
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.getByTestId('contact-list').getByRole('button').first().click()
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.getByRole('button', { name: 'Confirmar' }).click()
  await expect(page.getByRole('button', { name: 'Reintentar' })).toBeVisible()
})
```

> Note: disable mutation `retry` in the E2E build path is unnecessary — the forced `network_error` returns fast; the retry backoff will still resolve to the error state. If flakiness appears, set `retry: 0` for the transaction mutation when `x-mock-outcome` is present.

- [ ] **Step 2: Run E2E**

Run: `npm run test:e2e`
Expected: all specs PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e
git commit -m "test(e2e): login, guard, happy-path transfer, network-error retry"
```

---

## Task 15: Deployment (Railway) + documentation

**Files:**
- Create: `Dockerfile`, `.dockerignore`, `railway.toml`, `README.md`, `DECISIONS.md`, `AI_USAGE.md`

**Interfaces:** none (final packaging).

- [ ] **Step 1: Add Dockerfile (standalone)**

`Dockerfile`:

```dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

`.dockerignore`:

```
node_modules
.next
.git
tests
docs
```

- [ ] **Step 2: Add railway.toml**

```toml
[build]
dockerfilePath = "Dockerfile"

[deploy]
healthcheckPath = "/login"
healthcheckTimeout = 30
restartPolicyType = "on_failure"
```

- [ ] **Step 3: Write README.md**

Include: what it is, stack, `npm install`, `npm run dev`, `npm test`, `npm run test:e2e`, build/deploy notes (Railway), the **"Reiniciar demo"** button and the `ALLOW_DEMO_RESET` env var (`false` disables it), **known limitations** (in-memory mock resets, mock cookie not secure, single-replica, demo reset only affects one replica), and **declared time spent** (fill in the real number).

- [ ] **Step 4: Write DECISIONS.md**

Cover: App Router + rendering per route (§6), Zustand + TanStack Query split, business rules in domain reused on server, money-in-cents, idempotency + backoff, cookie session + middleware, security posture, scalability notes, deployment choice, and "what I'd do with more time".

- [ ] **Step 5: Write AI_USAGE.md**

Cover: tools used and where, what was accepted vs corrected/rejected, and which decisions were the human's.

- [ ] **Step 6: Final verification**

Run: `npm test && npx tsc --noEmit && npm run build && npm run test:e2e`
Expected: all green, production build succeeds.

- [ ] **Step 7: Commit**

```bash
git add Dockerfile .dockerignore railway.toml README.md DECISIONS.md AI_USAGE.md
git commit -m "chore: Railway deployment config + project documentation"
```

---

## Self-Review Notes (for the planner, not a task)

- **Spec coverage:** Login (T10), Home + states (T11), Nueva Transacción (T12), Confirmación 5 outcomes (T7 + T12), business rules in domain reused server-side (T3 + T7), rendering strategy (T10/T11/T12), session cookie + guard (T5/T11), scalability via idempotency/backoff/SSR/cursor-ready (T7/T8), security (T6/T9), demo reset (T13), testing unit + E2E (T2/T3/T4/T5/T6/T7/T8/T9/T10/T12/T13 + T14), deployment (T15), docs (T15). All spec sections map to a task.
- **Type consistency:** `Cents`, `Contact`, `TransactionResult`, `ValidationResult`, `store` methods (incl. `reset`), `pickOutcome`, `checkRateLimit`, `encodeSession/decodeSession/readSessionFromCookieHeader`, `useCreateTransaction` payload — names are consistent across tasks.
- **Cookie testability:** routes set/delete cookies via `NextResponse.cookies` and read sessions via `readSessionFromCookieHeader(req.headers.get('cookie'))`, so route handlers are unit-testable without a Next request scope.
- **Known simplifications for the reviewer:** movements pagination is designed (cursor-ready shape) but seeded small; the `rate-limit` stub in T6 is intentionally replaced in T9; the demo reset (T13) is gated by `ALLOW_DEMO_RESET` and only affects a single Railway replica.

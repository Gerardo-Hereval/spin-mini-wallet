# Mini Wallet

**Repositorio:** https://github.com/Gerardo-Hereval/spin-mini-wallet

Aplicación web de billetera mínima (mini wallet) construida con **Next.js** y **TypeScript**. Simula el flujo completo de una transferencia de dinero entre contactos.

> **Rama `feat/sqlite-backend`:** esta rama reemplaza el store mock en memoria por una base de datos **SQLite** (`better-sqlite3`) detrás de las API Routes de Next, de modo que los datos **persisten entre reinicios**. La rama `main` (tag `v1.0.0`) conserva la versión con datos mockeados en memoria. La capa de dominio, las rutas, la UI y los tests no cambiaron: solo se intercambió el adaptador de persistencia (`src/lib/db/`).

Flujo principal: **Login → Home → Nueva Transacción → Confirmación / Comprobante**.

- **Login**: autenticación simulada (usuario mock + rate limiting básico). El formulario pide **email o teléfono** y una **contraseña** (mock: se acepta cualquier valor de al menos 6 caracteres; no hay auth real). Validación inline por campo (al salir del campo y al enviar) con el botón deshabilitado hasta que ambos sean válidos.
- **Home**: muestra el saldo y el historial de movimientos recientes, renderizado en el servidor para el primer paint.
- **Nueva Transacción**: wizard de transferencia. El destinatario se elige de una lista de favoritos (con avatar de iniciales, buscador y estado seleccionado) o se crea uno nuevo con validación de formato; luego monto → confirmar → resultado.
- **Confirmación / Comprobante**: la transacción puede resolver en distintos desenlaces simulados aleatoriamente (éxito, fondos insuficientes, error de red, timeout, etc.), cada uno con su propia pantalla de resultado. Los desenlaces de error indican explícitamente que no se realizó ningún cargo. El comprobante de éxito se puede **compartir como imagen (PNG)** — generada en el navegador con Canvas, sin dependencias: en móvil usa la Web Share API con archivo (→ WhatsApp/email/etc.) y en escritorio cae a **descargar el PNG**.

## Stack

- **Next.js 16** (App Router)
- **React 19**
- **TypeScript** en modo `strict`
- **Tailwind CSS 4** + **shadcn/ui**, con el tema `thegridcn-ui` (Poseidon) y un fondo de grid neón sutil (CSS puro, sin dependencias)
- **Zustand**: estado de cliente (sesión) y estado del wizard de transferencia
- **TanStack Query**: estado de servidor (fetching, cache, loading/empty/error)
- **zod**: validación de datos en el borde de cada ruta (cliente y servidor)
- **Vitest** + **React Testing Library**: pruebas unitarias y de componentes
- **Playwright**: pruebas end-to-end (E2E)

## Puesta en marcha

Requiere **Node 22** (ver `.nvmrc`).

```bash
npm install
```

### Desarrollo

```bash
npm run dev
```

### Pruebas unitarias (Vitest)

```bash
npm test
```

### Pruebas end-to-end (Playwright)

```bash
npm run test:e2e
```

> Playwright arranca automáticamente el servidor de desarrollo antes de correr los tests.

### Build de producción (standalone)

```bash
npm run build
```

### Chequeo de tipos

```bash
npm run typecheck
```

## Despliegue (Railway)

El proyecto se despliega vía **Docker** usando el modo `standalone` de Next.js (`output: 'standalone'` en `next.config.ts`), que empaqueta un `server.js` autocontenido con únicamente las dependencias necesarias en tiempo de ejecución.

- `Dockerfile`: build multi-stage (`deps` → `build` → `run`) sobre `node:22-alpine`, que termina ejecutando `node server.js`.
- `railway.toml`: le indica a Railway usar ese `Dockerfile`, con `healthcheckPath = "/login"`, `healthcheckTimeout = 30` y `restartPolicyType = "on_failure"`.
- Railway provee **TLS** en el dominio público, por lo que la cookie de sesión con el atributo `Secure` funciona correctamente en producción.

### Persistencia (SQLite) y Docker Compose

Los datos se guardan en una base de datos **SQLite** (`better-sqlite3`) accedida únicamente desde las API Routes (nunca desde el cliente). El esquema se crea y se siembra automáticamente al primer arranque (`src/lib/db/connection.ts`); el acceso vive en un `store` con la misma interfaz que tenía el mock (`src/lib/db/store.ts`), así que el resto de la app no cambió.

- **Local**: `npm run dev` crea la BD en `./data/wallet.db` (ignorada por git). Borra esa carpeta para volver al estado inicial.
- **Docker Compose** (levanta todo con un comando):

```bash
docker compose up --build
# app en http://localhost:3000, BD persistida en el volumen db-data
```

El `docker-compose.yml` monta un volumen `db-data:/data` y pasa `DATABASE_PATH=/data/wallet.db`, por lo que los datos sobreviven a reinicios y recreaciones del contenedor. En test, la BD usa `:memory:` (aislada por archivo de test).

### Variables de entorno

- `DATABASE_PATH`: ruta del archivo SQLite (por defecto `./data/wallet.db`; en Docker `/data/wallet.db`). En `NODE_ENV=test` se usa `:memory:`.
- `ALLOW_DEMO_RESET`: controla si el botón de "Reiniciar demo" está habilitado. Con `ALLOW_DEMO_RESET=false` el botón y el endpoint de reset quedan desactivados (útil para no exponer un reset público sin restricciones en un entorno compartido).

## Reiniciar demo

Tanto en el header de la aplicación como en la pantalla de login hay un botón **"Reiniciar demo"** que llama a `POST /api/dev/reset`. Este endpoint restablece los datos (saldo, movimientos, contactos) a su estado inicial (re-siembra la BD) y cierra la sesión activa, permitiendo repetir la demo desde cero. Este botón se puede desactivar con `ALLOW_DEMO_RESET=false`.

## Forzar el desenlace (solo desarrollo)

Como la confirmación resuelve en un desenlace aleatorio, en **modo desarrollo** aparece un pequeño panel flotante ("DEV · forzar desenlace") que permite fijar el resultado de la siguiente transacción (éxito, error de red, fondos insuficientes, timeout o error desconocido) para validar cada camino de forma determinista. El panel no se renderiza en producción y la API ignora el header `x-mock-outcome` fuera de desarrollo.

## Limitaciones conocidas

- **SQLite de archivo único**: los datos persisten en un archivo SQLite local/volumen. Es ideal para una sola instancia; para un despliegue multi-réplica se necesitaría un motor cliente-servidor (Postgres/MySQL) o SQLite replicado. El acceso concurrente dentro del proceso está protegido con transacciones y una reserva de `Idempotency-Key`.
- **Cookie de sesión mock**: la cookie de sesión (`httpOnly`, `Secure`, `SameSite=Lax`) no está firmada criptográficamente; es una simulación de sesión para efectos de la demo, no una implementación de sesión apta para producción real.
- **CSP con `'unsafe-inline'`**: la Content-Security-Policy configurada permite `'unsafe-inline'`, lo cual no es lo ideal para un endurecimiento de seguridad completo.
- **Rate limiter en memoria**: el limitador de intentos de login vive en memoria del proceso, por lo que no funciona correctamente en un despliegue multi-instancia.
- **Estado persistente y E2E**: como ahora la BD persiste en archivo, el saldo se puede "drenar" al correr la suite E2E repetidamente. Borra `./data/` (o el volumen `db-data`) para volver al estado inicial antes de una corrida limpia.
- **Timeout simulado sin `AbortController`**: el escenario `timeout` se simula con un delay del servidor (9-12s) y no con un `AbortController` del lado del cliente, por lo que ante un `timeout` aleatorio el usuario espera el delay completo antes de ver el estado — mejora futura.
- **Header `x-mock-outcome`**: es una utilidad de pruebas para forzar un resultado de confirmación específico; ahora solo se honra fuera de producción (`NODE_ENV !== 'production'`).

## Tiempo invertido

El desarrollo de este proyecto fue asistido por IA (Claude Code) en una sesión de trabajo enfocada, siguiendo un flujo de **spec → plan de implementación → desarrollo por subagentes** (una tarea por subagente) con revisión de código adversarial entre tareas.

_Horas reales invertidas: **~8 horas** (aproximadas)._

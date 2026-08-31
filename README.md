# Mini Wallet

Aplicación web de billetera mínima (mini wallet) construida con **Next.js** y **TypeScript**. Simula el flujo completo de una transferencia de dinero entre contactos, con datos mockeados en memoria (sin base de datos ni backend externo).

Flujo principal: **Login → Home → Nueva Transacción → Confirmación / Comprobante**.

- **Login**: autenticación simulada (usuario mock + rate limiting básico). El formulario pide **email o teléfono** y una **contraseña** (mock: se acepta cualquier valor de al menos 6 caracteres; no hay auth real). Validación inline por campo (al salir del campo y al enviar) con el botón deshabilitado hasta que ambos sean válidos.
- **Home**: muestra el saldo y el historial de movimientos recientes, renderizado en el servidor para el primer paint.
- **Nueva Transacción**: wizard de transferencia. El destinatario se elige de una lista de favoritos (con avatar de iniciales, buscador y estado seleccionado) o se crea uno nuevo con validación de formato; luego monto → confirmar → resultado.
- **Confirmación / Comprobante**: la transacción puede resolver en distintos desenlaces simulados aleatoriamente (éxito, fondos insuficientes, error de red, timeout, etc.), cada uno con su propia pantalla de resultado.

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

### Variables de entorno

- `ALLOW_DEMO_RESET`: controla si el botón de "Reiniciar demo" está habilitado. Con `ALLOW_DEMO_RESET=false` el botón y el endpoint de reset quedan desactivados (útil para no exponer un reset público sin restricciones en un entorno compartido).

## Reiniciar demo

Tanto en el header de la aplicación como en la pantalla de login hay un botón **"Reiniciar demo"** que llama a `POST /api/dev/reset`. Este endpoint restablece los datos mock (saldo, movimientos, contactos) a su estado inicial y cierra la sesión activa, permitiendo repetir la demo desde cero. Este botón se puede desactivar con `ALLOW_DEMO_RESET=false`.

## Limitaciones conocidas

- **Mock en memoria**: los datos (saldo, movimientos, contactos) viven en un singleton en memoria del proceso. Se reinician en cada redeploy y **no se comparten entre réplicas** — la app está pensada para correr con una sola réplica.
- **Cookie de sesión mock**: la cookie de sesión (`httpOnly`, `Secure`, `SameSite=Lax`) no está firmada criptográficamente; es una simulación de sesión para efectos de la demo, no una implementación de sesión apta para producción real.
- **CSP con `'unsafe-inline'`**: la Content-Security-Policy configurada permite `'unsafe-inline'`, lo cual no es lo ideal para un endurecimiento de seguridad completo.
- **Rate limiter en memoria**: el limitador de intentos de login vive en memoria del proceso, por lo que no funciona correctamente en un despliegue multi-instancia.
- **Estado del mock y E2E**: el estado del mock (singleton en `globalThis`) se puede "drenar" (por ejemplo, quedarse sin saldo o sin contactos disponibles) si se corre la suite E2E repetidamente contra un servidor de desarrollo reutilizado sin reiniciarlo entre corridas.
- **Timeout simulado sin `AbortController`**: el escenario `timeout` se simula con un delay del servidor (9-12s) y no con un `AbortController` del lado del cliente, por lo que ante un `timeout` aleatorio el usuario espera el delay completo antes de ver el estado — mejora futura.
- **Header `x-mock-outcome`**: es una utilidad de pruebas para forzar un resultado de confirmación específico; ahora solo se honra fuera de producción (`NODE_ENV !== 'production'`).

## Tiempo invertido

El desarrollo de este proyecto fue asistido por IA (Claude Code) en una sesión de trabajo enfocada, siguiendo un flujo de **spec → plan de implementación → desarrollo por subagentes** (una tarea por subagente) con revisión de código adversarial entre tareas.

_Horas reales invertidas: **[completar por el candidato]**._

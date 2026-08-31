# Decisiones de diseño

Este documento explica las decisiones de arquitectura y diseño tomadas durante el desarrollo de Mini Wallet, y el porqué de cada una.

## App Router y estrategia de renderizado por ruta

Se usó el **App Router** de Next.js, que permite combinar Server Components y (potencialmente) Server Actions con una estrategia de renderizado distinta según las necesidades de cada pantalla:

- **Login**: renderizado en cliente (CSR). Es un formulario interactivo simple sin datos que dependan del servidor antes de la interacción del usuario.
- **Home**: renderizado en el servidor (SSR). El saldo y los movimientos recientes se obtienen en el servidor para que el primer paint ya muestre datos reales (sin spinner inicial), y luego el cliente hidrata y toma el control de esos mismos datos vía TanStack Query para refetching, invalidaciones y estados de carga posteriores.
- **Transfer**: renderizado en cliente (CSR). El wizard de transferencia es altamente interactivo (múltiples pasos, validación en tiempo real, estado de reintento), por lo que vive completamente en el cliente.

## Zustand vs TanStack Query

Se separaron deliberadamente dos tipos de estado que suelen mezclarse por error:

- **Zustand**: estado de **cliente**, es decir, estado que le pertenece a la UI y no al servidor: la sesión (persistida) y el estado del wizard de transferencia (paso actual, datos del formulario, intento en curso). Este estado no tiene "loading/error" en el sentido de red; es sincrónico y local.
- **TanStack Query**: estado de **servidor**: saldo, movimientos, contactos, resultado de una transacción. Este tipo de estado sí necesita modelar carga, vacío y error, además de cache, invalidación y reintentos — exactamente lo que TanStack Query resuelve de forma nativa.

Mezclar ambos en un solo store habría obligado a reimplementar a mano el manejo de loading/cache que TanStack Query ya ofrece, o a persistir en Zustand datos que en realidad son responsabilidad del servidor.

## Arquitectura por capas

- **`domain/`**: lógica de negocio pura, sin dependencias de React ni de Next. Incluye el manejo de dinero en **centavos enteros** (nunca floats) y las reglas de validación de una transacción (`validateTransaction`).
- **Hooks**: encapsulan la lógica de aplicación (llamadas a la API, orquestación de mutaciones, idempotencia, reintentos) y son el puente entre `domain/` y los componentes.
- **Componentes UI**: estrictamente presentacionales. No contienen lógica de negocio ni llamadas directas a la API; reciben datos y callbacks.
- **Rutas API**: exponen los datos mock y aplican las reglas de negocio del lado servidor antes de mutar el estado.

Esta separación hace que el dominio sea testeable de forma aislada (sin renderizar React) y que la lógica de negocio no quede duplicada ni dispersa entre cliente y servidor.

## Reglas de negocio en el lugar correcto

`validateTransaction` es una función pura del dominio que se reutiliza en **dos lugares**:

1. En el cliente, para dar feedback inmediato (UX) mientras el usuario completa el wizard.
2. En el servidor, dentro de `POST /api/transactions`, que **vuelve a validar todo antes de cobrar**. El servidor nunca confía en que el cliente ya validó correctamente: la validación del cliente es solo una mejora de experiencia, la del servidor es la que realmente decide si la transacción procede.

## Idempotencia y reintentos

- Cada intento de transferencia genera una **`Idempotency-Key`** que viaja en la request.
- El servidor mantiene una **reserva síncrona in-flight** en el store mock: si dos requests concurrentes llegan con la misma key (por ejemplo, un doble clic o un reintento automático que se solapa con la respuesta original), solo una de ellas ejecuta el cobro; la otra recibe el resultado ya reservado. Esto evita el doble cargo.
- La misma `Idempotency-Key` se **reutiliza entre reintentos de un mismo intento** (por ejemplo, ante un `network_error` transitorio), pero se **limpia y regenera al iniciar una transacción distinta**, para que una segunda transferencia no se confunda con un replay de la primera.
- Para **fallos de transporte reales** (no desenlaces de negocio) se aplica reintento automático con **backoff + jitter**.

## Sesión y protección de rutas

- La sesión se maneja con una **cookie** (`httpOnly`, `Secure`, `SameSite=Lax`).
- `middleware.ts` protege las rutas `/home` y `/transfer`, redirigiendo a `/login` si no hay sesión válida.
- El servidor siempre **deriva el usuario autenticado a partir de la cookie**, nunca de un parámetro enviado por el cliente — esto evita ataques de tipo IDOR (Insecure Direct Object Reference), donde un cliente malicioso podría intentar operar sobre datos de otro usuario simplemente cambiando un identificador en la request.

## Seguridad

- **zod** valida el payload en el borde de cada ruta de API, tanto de entrada como de forma (nunca se confía en el tipo declarado en TypeScript en tiempo de ejecución).
- **Headers de seguridad** aplicados globalmente: CSP, `X-Frame-Options`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`.
- **Rate limiter** sobre `POST /api/auth/login`, para mitigar intentos de fuerza bruta contra el login.

## Escalabilidad (documentada, no implementada íntegramente)

Decisiones tomadas pensando en que el sistema pudiera crecer:

- **Server Components**: reducen el JavaScript enviado al cliente.
- **Idempotencia**: hace seguro reintentar sin duplicar efectos, lo que habilita balanceo de carga y reintentos automáticos del lado cliente sin miedo a doble cobro.
- **Movimientos con forma "cursor-ready"**: el modelo de datos de los movimientos está diseñado para soportar paginación por cursor en el futuro, aunque el seed de datos actual es pequeño y no lo requiere todavía.
- **Sesión stateless** (basada en cookie, sin sesión guardada en memoria del servidor por request): permite escalar horizontalmente sin sticky sessions para la autenticación.

Como evolución natural hacia un sistema de producción real:

- Reemplazar el mock por un **ledger append-only** persistente.
- **Confirmación asíncrona** de transacciones vía workers/colas, en vez de resolver el desenlace de forma síncrona en la misma request.
- **CDN/edge** para assets estáticos y rutas cacheables.
- **Redis** (u otro store compartido) para rate limiting y reservas de idempotencia cuando haya múltiples réplicas.

## Elección de despliegue

Se eligió **Railway** con un `Dockerfile` basado en el modo `standalone` de Next.js: es un despliegue simple, reproducible y con TLS provisto por la plataforma (necesario para que la cookie `Secure` funcione), sin necesidad de gestionar infraestructura adicional para una demo de este alcance.

## Edge cases detectados y corregidos durante el desarrollo

Estos son casos límite que se identificaron y corrigieron explícitamente durante el desarrollo (varios de ellos durante la revisión de código adversarial entre tareas), y que reflejan el nivel de rigor aplicado:

- **Dinero sin error de punto flotante**: el parseo de montos usa `toCents` con aritmética entera, evitando `* 100` sobre floats (que puede producir imprecisiones como `0.1 + 0.2 !== 0.3`).
- **Persistencia de contacto nuevo**: en el flujo de UI, un contacto nuevo se guarda en favoritos como acción explícita del usuario ("Guardar y seleccionar") vía `POST /api/contacts`, de forma independiente a completar la transferencia — comportamiento intencional. Adicionalmente, la ruta `POST /api/transactions` acepta un campo `newContact` y, en ese camino, solo persiste el contacto si la transacción tiene éxito (evita contactos huérfanos por reintentos vía API); esto está cubierto por tests unitarios, aunque no es el camino que usa la UI actual.
- **Evitar doble cargo**: mediante la reserva de idempotency-key descrita arriba, para requests concurrentes sobre el mismo intento.
- **Reutilización correcta de la idempotency-key**: la misma key se reutiliza entre reintentos del mismo intento, pero se limpia al iniciar una transacción nueva, para que no se confunda con un replay de la transacción anterior.
- **No mostrar "saldo insuficiente" mientras el saldo aún está cargando**: se evita un falso positivo de error de validación mientras el saldo real todavía no llegó del servidor (estado de carga distinto de "saldo insuficiente confirmado").

## Retry / backoff: distinción de responsabilidades

- Los **desenlaces de negocio** simulados (`network_error`, `timeout`, `insufficient_funds`, etc.) se modelan como **datos** de la respuesta, con **reintento manual** disponible en la UI (el usuario decide si reintenta).
- El **auto-retry con backoff + jitter** solo cubre **fallos de transporte reales** (por ejemplo, que la request ni siquiera llegue a completarse), no desenlaces de negocio simulados.

## Qué haría con más tiempo

- Backend y base de datos reales, con un ledger de transacciones append-only.
- Confirmación asíncrona de transacciones (colas/workers) en vez de resolución síncrona.
- Endurecer la CSP quitando `'unsafe-inline'`.
- Evicción de entradas antiguas en el rate limiter en memoria (actualmente puede crecer sin límite).
- Un helper compartido para reducir duplicación en los tests E2E.
- Ampliar la cobertura de ramas en las pruebas unitarias, especialmente de casos de error menos frecuentes.

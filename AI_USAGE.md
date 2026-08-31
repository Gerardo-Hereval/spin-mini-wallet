# Uso de IA en este proyecto

Este documento describe honestamente cómo se usó IA durante el desarrollo de Mini Wallet.

## Herramienta y flujo de trabajo

Se usó **Claude Code** (modelo Fable), orquestando un flujo de:

1. **Spec**: definición del alcance y comportamiento esperado de cada parte del sistema.
2. **Plan de implementación**: descomposición del trabajo en tareas concretas y ordenadas.
3. **Desarrollo por subagentes**: un subagente independiente por tarea, cada uno enfocado en un alcance acotado (por ejemplo: dominio de dinero, validación, idempotencia, sesión/middleware, login, home, wizard de transferencia, seguridad, reset de demo, testing, despliegue).
4. **Revisión de código adversarial** entre tareas: antes de dar por cerrada una tarea, se revisó el código producido buscando activamente errores, en lugar de asumir que la primera versión era correcta.

## Qué se aceptó de la IA

- La **arquitectura general** del proyecto (capas `domain/` / hooks / componentes / rutas API, separación de estado cliente vs. servidor).
- El **andamiaje** (scaffolding) de rutas, componentes, stores, hooks y configuración de testing.

## Qué se corrigió o rechazó

La revisión de código adversarial detectó y corrigió varios errores reales presentes en el código de primera pasada, entre ellos:

- Una variable de fuente `--font-sans` que se **auto-referenciaba a sí misma** en la configuración de estilos.
- **Redondeo de dinero usando aritmética de punto flotante** (en vez de centavos enteros), con riesgo de imprecisiones.
- En la ruta `POST /api/transactions` (camino que acepta un `newContact` embebido, distinto del flujo de UI donde el contacto se guarda antes vía `POST /api/contacts`): el contacto embebido se persistía antes de validar la transacción, en lugar de solo tras un resultado exitoso, lo que podía dejar contactos huérfanos ante reintentos por API.
- Una **condición de carrera de doble cargo**: dos requests concurrentes con la misma intención de transferencia podían procesarse ambas sin la reserva de idempotencia.
- Una **idempotency-key que se regeneraba en cada reintento** (en vez de reutilizarse dentro del mismo intento) y que **no se limpiaba entre transacciones distintas**, lo cual podía provocar que una segunda transferencia se tratara como replay de la primera.
- Un **parpadeo de "saldo insuficiente"** que aparecía brevemente mientras el saldo real todavía se estaba cargando, antes de tener el dato confirmado.

## Qué decidió el humano (Carlos), no la IA

Las siguientes decisiones fueron tomadas explícitamente por el desarrollador humano, no sugeridas ni impuestas por la IA:

- El **nivel objetivo** del proyecto (una solución senior y completa, no un MVP mínimo).
- La elección del **stack**: App Router, Zustand + TanStack Query como combinación de manejo de estado, el tema `thegridcn-ui` (Poseidon) para shadcn/ui, y Vitest + Playwright como stack de testing.
- Usar **sesión por cookie** en lugar de limitarse a `localStorage`.
- La idea del botón **"Reiniciar demo"**.
- Pedir explícitamente un **análisis de escalabilidad** y un **análisis de seguridad** como parte del entregable.
- La decisión de **desplegar en Railway**.

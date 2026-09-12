# Checkpoint: tareas 1–10

Documento histórico. El bloque posterior completo y la validación actual están en [Persona 3](persona-3-checkpoint.md). El selector Locked/Unlocked por URL ya no existe; ahora se verifica membership mock antes de solicitar contenido.

Se ejecutó este bloque tras la autorización para abarcar las tareas necesarias. Las rutas ya existían: se conservaron y ajustaron sus componentes, sin crear otra aplicación. Los perfiles y el dashboard recibieron ajustes mínimos para consumir los nuevos datos y evitar enlaces inconsistentes; no se dan por completadas todas las tareas posteriores.

Validación realizada: build y TypeScript del frontend aprobados; lint sin errores y con dos advertencias previas. Diez casos HTTP aprobados: rutas existentes, tres publicaciones distintas, creator conocido, listado vacío y dos 404. Se comprobó ausencia de fixtures premium en las respuestas y en los 26 scripts cliente servidos por esas rutas. Esto no equivale a una prueba de autorización real ni a una revisión visual del navegador.

Todos los checklists siguientes son para tu validación manual pendiente. Los comandos usan `npm run` porque pnpm no estaba instalado globalmente en esta máquina; las dependencias y el lockfile se gestionan con pnpm 10.34.5. Ejecuta una vez `npm run dev` y abre `http://localhost:3000`.

### Tarea 1 — Verificar el proyecto y el stack actual

**Objetivo**

Identificar el stack y distinguir errores frontend de los problemas previos de contratos.

**Archivos que probablemente modificaremos**

Diagnóstico en `docs/frontend-architecture.md`; ajustes necesarios de herramientas en `package.json`, `pnpm-lock.yaml`, PostCSS, ESLint y configuraciones TypeScript.

**Prompt de ejecución**

> Revalida únicamente la Tarea 1 sobre el estado actual. Comprueba versiones, TypeScript, lint y build. Distingue advertencias del frontend de errores heredados de Hardhat. No implementes nuevas funcionalidades.

**Qué NO debemos hacer todavía**

Modificar contratos o desplegar.

**Checklist de pruebas manuales**

- Ejecutar `npm run typecheck`, `npm run lint` y `npm run build`.
- Ejecutar `npm run typecheck:contracts`: sus errores heredados están documentados.
- Abrir `/` y revisar consola del navegador y terminal.

**Criterio de éxito**

El frontend compila y los límites del toolchain de contratos son explícitos.

**Checkpoint Git recomendado**

Revisar configuraciones y lockfile. Mensaje: `chore: align frontend toolchain and document baseline`.

### Tarea 2 — Crear la arquitectura mínima de carpetas

**Objetivo**

Separar rutas, UI, dominio, consultas y fixtures sin mover la aplicación a `src/`.

**Archivos que probablemente modificaremos**

`types/`, `features/publications/`, `lib/mocks/`, `components/layout/`, documentación.

**Prompt de ejecución**

> Revalida únicamente la Tarea 2. Revisa los límites de carpetas y TypeScript estricto, sin introducir nuevas abstracciones ni funcionalidades.

**Qué NO debemos hacer todavía**

Implementar los adaptadores SDK definitivos.

**Checklist de pruebas manuales**

- Ejecutar `npm run typecheck` y comprobar `strict: true`.
- Abrir `/` y buscar imports rotos en consola y terminal.

**Criterio de éxito**

Las pantallas consultan funciones de aplicación y los componentes visuales no leen contratos.

**Checkpoint Git recomendado**

Revisar carpetas y documentación. Mensaje: `chore: establish frontend module boundaries`.

### Tarea 3 — Crear el layout global

**Objetivo**

Compartir tema oscuro, acento rojo, contenedor, header, footer y foco visible.

**Archivos que probablemente modificaremos**

`app/layout.tsx`, `app/globals.css`, `components/layout/`.

**Prompt de ejecución**

> Revalida únicamente la Tarea 3. Comprueba layout, legibilidad, foco y adaptación básica sin rediseñar la aplicación ni añadir funcionalidades.

**Qué NO debemos hacer todavía**

Construir los estados transaccionales.

**Checklist de pruebas manuales**

- Abrir `/` y `/create`, a 375 px y en escritorio.
- Presionar Tab: debe aparecer Skip to content y funcionar con Enter.
- Revisar desbordamientos, consola y terminal; ejecutar `npm run typecheck`.

**Criterio de éxito**

Las rutas comparten una base visual legible y navegación por foco.

**Checkpoint Git recomendado**

Revisar layout y estilos. Mensaje: `feat: add shared application layout`.

### Tarea 4 — Crear la navegación principal

**Objetivo**

Habilitar Explore, Create y Dashboard también en móvil.

**Archivos que probablemente modificaremos**

`components/layout/main-navigation.tsx`, `components/layout/site-header.tsx`.

**Prompt de ejecución**

> Revalida únicamente la Tarea 4. Comprueba destinos, estado activo y uso con teclado y móvil. No añadas nuevas secciones.

**Qué NO debemos hacer todavía**

Completar la integración de wallet o redes.

**Checklist de pruebas manuales**

- Presionar Explore, Create, Dashboard y el logo.
- Verificar URL y `aria-current` del enlace activo.
- Probar Tab y Enter a 375 px; revisar consola, terminal y `npm run typecheck`.

**Criterio de éxito**

Todos los destinos son accesibles sin depender de una navegación oculta en móvil.

**Checkpoint Git recomendado**

Revisar los dos componentes de navegación. Mensaje: `feat: add accessible responsive navigation`.

### Tarea 5 — Validar las cinco rutas existentes

**Objetivo**

Conservar las rutas del MVP y corregir sus parámetros para Next 16.

**Archivos que probablemente modificaremos**

`app/**/page.tsx`, rutas dinámicas y sus `not-found.tsx`.

**Prompt de ejecución**

> Revalida únicamente la Tarea 5. Comprueba acceso directo, recarga y parámetros de las cinco rutas existentes, sin implementar sus flujos pendientes.

**Qué NO debemos hacer todavía**

Dar por terminados Publish, Dashboard, wallet o backend.

**Checklist de pruebas manuales**

- Abrir y recargar `/`, `/create`, `/dashboard`, `/content/membership-experiences` y `/profile/0x1111111111111111111111111111111111111111`.
- Revisar consola y terminal por errores de parámetros asíncronos.
- Ejecutar `npm run typecheck`.

**Criterio de éxito**

Las cinco rutas responden; Create conserva su prototipo y Dashboard su estado desconectado.

**Checkpoint Git recomendado**

Revisar rutas y parámetros. Mensaje: `fix: align application routes with app router`.

### Tarea 6 — Definir los tipos del dominio

**Objetivo**

Separar Publication pública, Creator, membership, proof y PremiumContent.

**Archivos que probablemente modificaremos**

`types/creator.ts`, `types/publication.ts`.

**Prompt de ejecución**

> Revalida únicamente la Tarea 6. Comprueba tipos explícitos, separación público/premium y referencias pendientes o confirmadas. No añadas implementaciones Web3.

**Qué NO debemos hacer todavía**

Asignar direcciones de contratos de despliegues no verificados.

**Checklist de pruebas manuales**

- Ejecutar `npm run typecheck`.
- Revisar que Publication no contenga `body` y el precio sea una cadena decimal.
- Abrir `/` y confirmar ausencia de regresiones en consola y terminal.

**Criterio de éxito**

Los modelos no mezclan contenido privado ni referencias pendientes con confirmadas.

**Checkpoint Git recomendado**

Revisar tipos. Mensaje: `feat: define explicit publication domain types`.

### Tarea 7 — Crear datos mock compartidos

**Objetivo**

Proveer tres publicaciones y cuatro creators deterministas mediante un repositorio.

**Archivos que probablemente modificaremos**

`lib/mocks/`, `features/publications/repository.ts`.

**Prompt de ejecución**

> Revalida únicamente la Tarea 7. Comprueba IDs, relaciones entre creators y publicaciones, datos inexistentes y separación de fixtures premium. No añadas persistencia ni llamadas reales.

**Qué NO debemos hacer todavía**

Presentar precios DEMO o proofs pendientes como datos on-chain reales.

**Checklist de pruebas manuales**

- Ejecutar `npm run typecheck` y `npm run lint`.
- Abrir `/profile/0x4444444444444444444444444444444444444444`: debe estar vacío.
- Revisar Network y comprobar ausencia de `Premium demo:` en las respuestas públicas; revisar consola y terminal.

**Criterio de éxito**

Los datos son consistentes, reproducibles y no incorporan el cuerpo premium al repositorio público.

**Checkpoint Git recomendado**

Revisar fixtures y repositorio. Mensaje: `feat: add deterministic public content fixtures`.

### Tarea 8 — Construir Explore

**Objetivo**

Mostrar previews, creators, fecha, lectura estimada, precio demo y estado Locked.

**Archivos que probablemente modificaremos**

`app/page.tsx`, `components/content/content-card.tsx`, `publication-list.tsx`.

**Prompt de ejecución**

> Revalida únicamente la Tarea 8. Comprueba las cards de Explore, sus enlaces y el estado vacío compartido. No añadas búsqueda, filtros ni compras.

**Qué NO debemos hacer todavía**

Implementar Subscribe ni filtros adicionales.

**Checklist de pruebas manuales**

- Abrir `/` y presionar cada título y Read preview.
- Presionar el nombre de cada creator y confirmar su perfil.
- Revisar a 375 px, consola y terminal; ejecutar `npm run typecheck`.

**Criterio de éxito**

Cada card lleva a su publicación y al creator correcto.

**Checkpoint Git recomendado**

Revisar Explore, card y listado. Mensaje: `feat: build explore from shared publication data`.

### Tarea 9 — Construir el detalle público

**Objetivo**

Mostrar la publicación del ID solicitado sin exponer contenido premium.

**Archivos que probablemente modificaremos**

`app/content/[id]/page.tsx`, `app/content/[id]/not-found.tsx`.

**Prompt de ejecución**

> Revalida únicamente la Tarea 9. Comprueba contenido por ID, metadatos, navegación de vuelta y publicación inexistente. No renderices el premium.

**Qué NO debemos hacer todavía**

Verificar memberships ni mostrar un proof confirmado.

**Checklist de pruebas manuales**

- Abrir `/content/membership-experiences`, `/content/creator-toolkit` y `/content/behind-the-proof`: deben ser distintos.
- Abrir `/content/id-inexistente` y presionar Back to Explore.
- Inspeccionar HTML y Network; revisar consola, terminal y `npm run typecheck`.

**Criterio de éxito**

Los IDs válidos muestran su preview y el inexistente devuelve 404.

**Checkpoint Git recomendado**

Revisar detalle y 404. Mensaje: `feat: add public publication detail and not found state`.

### Tarea 10 — Implementar Locked

**Objetivo**

Mostrar el bloqueo y la oferta demo de membership con una acción todavía deshabilitada.

**Archivos que probablemente modificaremos**

`components/membership/locked-content.tsx` y su composición en el detalle.

**Prompt de ejecución**

> Revalida únicamente la Tarea 10. Comprueba Locked, precio, duración, Subscribe deshabilitado y explicación visible. No implementes Unlocked ni compras.

**Qué NO debemos hacer todavía**

Ejecutar pagos, verificar contratos o desbloquear contenido.

**Checklist de pruebas manuales**

- Abrir una publicación y localizar Locked, precio DEMO y duración.
- Intentar presionar Subscribe: no debe abrir wallet ni checkout.
- Verificar que el premium no esté oculto por CSS ni presente en el payload.
- Revisar consola y terminal; ejecutar `npm run typecheck`.

**Criterio de éxito**

El usuario entiende el beneficio y que la compra todavía no está disponible.

**Checkpoint Git recomendado**

Revisar Locked y detalle. Mensaje: `feat: add explicit locked membership preview`.

## Checkpoint conjunto sugerido

No se creó ningún commit. Los cambios comparten tipos y componentes, por lo que puede revisarse y guardar este bloque como un único checkpoint coherente:

```bash
git diff --check
git diff --stat
git diff
git status --short
# Revisar también los archivos nuevos; git diff no los muestra antes de agregarlos.
git add app components features lib types docs README.md package.json pnpm-lock.yaml postcss.config.mjs tailwind.config.ts next.config.ts tsconfig.json tsconfig.contracts.json eslint.config.mjs .gitignore AGENTS.md CLAUDE.md
git diff --cached
git commit -m "feat: establish typed creator previews and locked content flow"
```

Continuaciones implementadas: [Tarea 11 — estado Unlocked con contenido ficticio](task-11-unlocked.md) y [Tarea 12 — flujo mock de Subscribe](task-12-subscribe.md). Revisión visual manual pendiente. El bloque 1–11 ya está guardado en el commit `2885a10`; las indicaciones anteriores de cambios sin commit describen el checkpoint original.

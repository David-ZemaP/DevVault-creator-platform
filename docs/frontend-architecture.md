# Frontend: primer checkpoint

Estado final del bloque: consultar [checkpoint Persona 3](persona-3-checkpoint.md). Los apartados siguientes conservan el diagnóstico histórico; Create, Dashboard, Subscribe y las redes tienen las ampliaciones descritas en ese documento. Los helpers de Unlock/Avalanche sin referencias y el selector URL se retiraron; lint ya no tiene las dos advertencias originales.

## Stack verificado

Se conserva el App Router en `app/`, el alias `@/*` desde la raíz y TypeScript estricto. No se introduce `src/` ni otro framework.

Al iniciar el servidor, Next generó `AGENTS.md` y `CLAUDE.md` con sus instrucciones para agentes. Se conservan esos archivos generados; no son modificaciones de contratos ni configuración de despliegue.

| Herramienta | Versión utilizada |
| --- | --- |
| Next.js | 16.3.4 |
| React / React DOM | 19.3.0 |
| TypeScript | 5.9.3 |
| Tailwind CSS / PostCSS plugin | 4.3.3 |
| RainbowKit | 2.2.11 |
| Wagmi | 2.19.5 |
| Viem | 2.56.3 |
| ESLint | 9.39.5 |
| pnpm | 10.34.5 |

El lockfile inicial fijaba TypeScript 7 y ESLint 10, incompatibles con los plugins de lint instalados, y Wagmi 3, fuera del peer range de RainbowKit. Se ajustaron esas tres versiones y se fijaron las restantes a lo ya resuelto para evitar actualizaciones involuntarias mediante `latest`.

Tailwind 4 necesita `@tailwindcss/postcss` y `@import "tailwindcss"`. Se conserva el tema de `tailwind.config.ts` mediante `@config`. Se usa la CLI de ESLint porque `next lint` fue retirado. Next se ejecuta con `--webpack` para conservar su configuración existente. El alias de Base Account selecciona su entrypoint de navegador: su entrypoint Node importa un SDK de pagos que no corresponde al conector de wallet del frontend.

Referencias consultadas: [Next.js 16](https://nextjs.org/docs/app/guides/upgrading/version-16), [Tailwind con PostCSS](https://tailwindcss.com/docs/installation/using-postcss). Los peer ranges se comprobaron en los manifiestos instalados.

## Responsabilidades

- `app/`: composición de rutas y metadatos. Los parámetros dinámicos se esperan con `await`.
- `components/layout/`: header, navegación activa y móvil; el layout raíz conserva el provider existente.
- `components/content/`: card y listado compartidos, incluido el estado vacío.
- `components/membership/locked-content.tsx`: presentación Locked, sin llamadas a red.
- `types/`: contratos públicos del dominio, oferta de membership, referencias de proof y tipo premium separado.
- `features/publications/repository.ts`: consultas de aplicación sobre fixtures; las páginas no importan arrays directamente.
- `features/publications/create-preview.ts`: cálculo local del hash del formulario anterior; no publica ni registra nada.
- `lib/mocks/`: creators y publicaciones deterministas. El archivo premium está separado del repositorio público y del bundle cliente. Desde la Tarea 11, una función `server-only` selecciona el fixture únicamente para Unlocked en desarrollo.
- `lib/web3/`: integración heredada, pendiente del contrato con la Persona 2. El detalle público ya no utiliza el gate real anterior.
- `lib/api/`: cliente heredado; todavía no hay backend de contenido protegido.

## Estado del producto

Explore y el detalle público usan el mismo repositorio. Todos los artículos de este checkpoint comienzan como previews premium Locked. Subscribe está deshabilitado en producción; la [Tarea 12](task-12-subscribe.md) incorpora una confirmación de suscripción ficticia en desarrollo que abre el preview Unlocked. `DEMO` es una unidad ficticia; no representa una cotización ni una moneda de la red. Los locks y proofs están pendientes, sin direcciones ni hashes inventados.

La [Tarea 11](task-11-unlocked.md) añade un escenario visual Unlocked exclusivo de desarrollo, con la confirmación y el cuerpo ficticio correspondientes. Producción ignora `previewAccess=unlocked` y sigue Locked. No se compran ni verifican memberships y el selector no representa autorización.

Los perfiles previos se adaptaron al repositorio para evitar enlaces rotos y autores inconsistentes. Un creator sin publicaciones permite verificar el listado vacío. El dashboard conserva su requisito previo de conexión, lista solo contenido del address actual y ya no inventa ingresos o subscribers. El formulario previo conserva únicamente la vista de hash local; todavía no implementa el flujo Publish del plan.

El conector de wallet anterior se conserva. Sin `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` usa exclusivamente una wallet inyectada: no necesita secretos ni un Project ID ficticio para WalletConnect. No se han validado todavía conexión real, compra, cambio de red o firma. La configuración de cadenas heredada sigue siendo Avalanche; la configuración definitiva de HashKey/Fuji corresponde a la Tarea 20.

Ningún mock constituye autorización real. Antes de integrar datos premium reales, el backend debe autenticar la wallet y verificar membership en servidor antes de entregar el contenido (Tarea 26).

## Comandos

```bash
pnpm install --frozen-lockfile
pnpm dev
pnpm typecheck
pnpm lint
pnpm build
```

Si pnpm no está instalado, sin instalación global:

```bash
npm exec --yes --package=pnpm@10.34.5 -- pnpm install --frozen-lockfile
npm run dev
npm run typecheck
npm run lint
npm run build
```

No hace falta crear `.env.local` para recorrer Explore, contenido o perfiles. No incluir claves privadas en variables públicas.

## Verificaciones y límites conocidos

- Build de producción y TypeScript del frontend: aprobados.
- Lint: aprobado con dos advertencias en componentes previos (`loading` sin uso en el gate antiguo y un `img` del conector de wallet).
- La revisión visual, el teclado, la consola del navegador y wallets reales requieren prueba manual: no había navegador disponible en la sesión de implementación.
- El build muestra una advertencia del SDK de MetaMask sobre almacenamiento React Native opcional. No se instaló una dependencia móvil para esta aplicación web.
- Node 26 de esta máquina emite avisos sobre módulos y `localStorage`. No se añadieron excepciones globales para ocultarlos.
- La instalación mantiene advertencias de peer dependencies transitivas de WalletConnect (React/Zod); la validación funcional de conectores queda pendiente de la Tarea 19.
- Se eligió ESLint 9 por compatibilidad con los plugins existentes, aunque el registry ya lo marca fuera de soporte. Actualizarlo junto con sus plugins es una tarea de mantenimiento futura, no una actualización aislada a ESLint 10.

## Contratos: diagnóstico independiente

`pnpm typecheck` comprueba el frontend; `pnpm typecheck:contracts` conserva visible el diagnóstico de Hardhat. No se desactiva el chequeo de errores de Next.

El segundo comando falla por problemas anteriores: redes con sintaxis de Hardhat 2 frente a Hardhat 3, imports de `ethers` incompatibles y tipos/dependencias de Chai/Mocha ausentes. Los contratos, scripts de despliegue y tests Solidity no se modificaron. La CI existente aún ejecuta ese toolchain y no se considera reparada por este checkpoint.

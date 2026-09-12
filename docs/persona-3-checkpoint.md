# Persona 3 — checkpoint frontend/demo

## Alcance terminado

Se integró el trabajo existente de la rama `feat/frontend-checkpoint-tasks-1-11` sin cambiar de rama ni hacer commit, push o merge. Las cinco rutas originales se conservan. No se añadieron dependencias ni se modificaron contratos, despliegues o el lockfile.

- Sesión demo compartida: connected, disconnected, connecting, error, selección de cuenta, wallet required e invalidación al cambiar sesión.
- Redes: HashKey Chain Testnet (133) para memberships y Avalanche Fuji (43113) para proofs. Selector, red requerida/actual, switching, success, error y retry. Wagmi/RainbowKit usan esas mismas redes; la demo no utiliza sus conectores reales.
- Subscribe: Locked → confirmación → pending → referencia de compra → verificación → membership detected → contenido. Rechazo, transacción fallida, lectura fallida y membership demorada mantienen Locked. El reintento conserva la compra. Hay exclusión de doble envío, IDs idempotentes y tiempo máximo de espera.
- Create: título, descripción, texto ficticio, gated, precio y duración; validaciones inline y foco en el primer error. Los datos públicos y el cuerpo se explican por separado. El hash excluye el cuerpo, incluso cuando es público.
- Publish: revisión, creación del lock si es gated, confirmación y cambio mock a Fuji, proof, éxito. Un fallo conserva el lock; el proof puede recuperarse desde Create o Dashboard. Publicaciones públicas omiten membership.
- Dashboard y Profile: publicaciones iniciales y nuevas filtradas por creator; métricas rotuladas como ficticias; loading, error, retry, vacío; enlaces a contenido y perfil. Perfil inexistente tiene 404.
- Referencias: Simulation ID sin enlaces falsos. Solo direcciones/hashes con formato válido y redes reconocidas producen links de explorer.
- Dev/prod: query params no conceden acceso; producción no renderiza controles de sesión ni habilita Publish/Subscribe demo; la acción de fixtures rechaza producción.
- UX: escalas y componentes existentes, botones adaptables, foco visible, errores accesibles y verificación visual a 375, 768 y 1440 px.

## Arquitectura final

| Capa | Responsabilidad |
| --- | --- |
| `app/` | Rutas, metadata y composición; los query params no son permisos. |
| `components/content/`, `membership/`, `transaction/`, `wallet/` | Presentación e interacción; no contienen RPC ni llamadas raw a contratos. |
| `features/demo/session.ts` y `use-session.ts` | Snapshot de cuenta/red y suscripción React, revisión de sesión y cambios simulados. |
| `features/demo/subscription.ts` | Flujo de aplicación inyectable con `Web3Adapter` y `PremiumContentPort`; verifica antes de recuperar el contenido. |
| `features/demo/membership-runtime.ts` | Composición del adaptador mock y la entrega ficticia; punto para conectar los puertos reales. |
| `features/demo/publishing.ts` | Validación, digest público, publicaciones y cuerpos separados en memoria, recuperación de proof y lectura local verificada. |
| `lib/web3/types.ts`, `integration.ts` | Interfaces de SDK, wallet y contenido protegido. |
| `lib/web3/adapters/mock.ts`, `demo.ts` | Simulaciones con errores, expiración e idempotencia; instancia compartida en la pestaña. |
| `features/demo/premium-action.ts` | Acción Next exclusiva de desarrollo para fixtures ficticios, importados desde un módulo `server-only`. |

`MembershipGate` es presentación de un resultado recibido; no consulta contratos ni inventa permisos. Los datos premium no se incluyen en el repositorio público. Los cuerpos de publicaciones creadas en esta pestaña se recuperan mediante un servicio que vuelve a consultar el adaptador, independientemente de un booleano de React.

## Cómo probar Subscriber

1. `npm run dev`; abrir `/` y una publicación, por ejemplo `/content/membership-experiences`.
2. Abrir **Demo wallet & network**. Por defecto: Valeria y HashKey Testnet.
3. Subscribe → revisar confirmación → Confirm transaction. Comprobar Pending y botones deshabilitados.
4. Ver Simulation ID, Membership detected y CONTENT UNLOCKED.
5. Para repetir desde cero, recargar. Probar rejected transaction, failed transaction, membership delayed y verification read error. Los dos últimos ofrecen Retry verification, sin una nueva compra.
6. Desconectar: se retira el cuerpo. Cambiar a Andrés: comienza Locked. Seleccionar red no soportada: Subscribe queda bloqueado; Switch/Retry vuelve a HashKey.
7. Abrir `?unlocked=true`, `?previewAccess=unlocked` o ambos: permanece Locked.

## Cómo probar Creator

1. Conectar una cuenta demo y abrir `/create`.
2. Revisar el formulario vacío: errores inline, foco en Title y ninguna operación Web3.
3. Completar título, descripción y texto ficticio; precio positivo y duración de 1–365 días si gated.
4. Review publication → inspeccionar el digest público → Confirm publication en HashKey.
5. El lock queda creado; cambiar a Fuji y confirmar proof. Probar proof-error y recuperar desde Dashboard con Retry proof only.
6. Ver publicación creada en Dashboard, abrir detalle y perfil. Para leer una gated, volver a HashKey y completar Subscribe/verificación.
7. Desmarcar gated para probar publicación pública: no crea lock ni requiere precio/cuerpo premium.
8. En Dashboard probar Loading, Read error/Retry y Empty creator. Diego también tiene un perfil inicial vacío.

## Persistencia y seguridad

- Todo estado mock vive en memoria de la pestaña. Navegación mediante links conserva la sesión; recarga, cierre o ciertas actualizaciones de desarrollo la reinician. No hay persistencia en localStorage/cookies de permisos.
- Las nuevas rutas `demo-<uuid>` solo tienen datos en la pestaña creadora. Tras recargar muestran “Demo publication unavailable”. El UUID es un identificador local, nunca un hash on-chain.
- Una cuenta demo no prueba identidad. Los fixtures son públicos/ficticios a efectos de seguridad: la acción de desarrollo no autentica wallets y no debe reutilizarse como backend protegido. El flujo normal la llama solo después de verificar el mock. En producción devuelve access-denied antes de importar el fixture.
- Contenido ya entregado puede permanecer en memoria/caché/historial del navegador. Desconectar retira la presentación; no revoca bytes recibidos.
- No introducir secretos ni contenido premium real en esta demo. Cambiar un parámetro URL o estado visual nunca se considera autorización de producción.
- No se inventaron contratos ni transacciones reales. Las referencias mock se identifican explícitamente como Simulation ID; las métricas son fixtures rotulados.

## Integración pendiente, fuera de Persona 3

- Wallet: implementar `WalletPort` (`getSnapshot`, `subscribe`, `connect`, `disconnect`, `switchNetwork`) y conectar la sesión de aplicación a los eventos del conector real. Validar cambios de cuenta/red y rechazos. El provider heredado está preparado con ambas testnets; no se validó una wallet real.
- Persona 2: implementar `Web3Adapter` con los cinco métodos existentes. Writes deben resolver después de confirmación; conservar requestId/idempotencia, errores tipados, referencias verificables y distinción de redes. Sustituir la instancia mock en los servicios, no introducir SDK/RPC en componentes visuales.
- Backend: implementar `PremiumContentPort` y persistencia de publicaciones. Autenticar la wallet con sesión verificable, prevenir replay y comprobar membership en servidor antes de entregar contenido. No existe contrato API definitivo y no se inventaron endpoints de producción.

## Validación reproducible

```bash
npm run lint
npm run typecheck
npm run typecheck:demo
npm run test:demo
npm run build
npm run typecheck:contracts
# Servidores en terminales separadas:
npm run dev
npm run start -- --port 3001
# Regresiones HTTP:
npm run test:access -- development http://127.0.0.1:3000
npm run test:access -- production http://127.0.0.1:3001
git status
git diff --stat
git diff --check
```

Ejecutar typecheck y build secuencialmente: Next regenera `.next/types` y puede producir un fallo transitorio si se ejecutan a la vez.

Las pruebas de dominio ejercitan el mismo controlador utilizado por React: compras concurrentes, doble execute, cambio de sesión en vuelo, red incorrecta, rechazo, compra fallida, verificación demorada/RPC, entrega posterior a verificación, timeout, expiración, separación entre cuentas, validación, hash sin cuerpo, recuperación e idempotencia del proof, publicación pública y bloqueo en producción. También comprueban lectura local antes/después de membership y aislamiento del autor.

En navegador se comprobaron los recorridos completos Subscriber y Creator, publicación pública, recuperación desde Dashboard, Profile, desconexión/segunda cuenta, red incorrecta y retry, controles Pending deshabilitados, recarga, query params y estados de listas. Skip to content llevó el foco al main y Enter permitió navegar al Dashboard. No hubo errores de consola de la aplicación. Se inspeccionaron móvil/tablet/escritorio sin scroll horizontal.

### Resultados del checkpoint

| Comprobación | Resultado |
| --- | --- |
| `npm run lint` | Aprobado, 0 errores y 0 advertencias. |
| `npm run typecheck` | Aprobado. |
| `npm run typecheck:demo` | Aprobado. |
| `npm run test:demo` | Aprobado en desarrollo y producción. |
| `npm run build` | Aprobado, con advertencias heredadas indicadas abajo. |
| Regresiones HTTP | 21 casos por entorno: 42 aprobados. Fixtures ausentes de 41 scripts cliente de desarrollo y 16 de producción. |
| Navegador producción | Subscribe deshabilitado, sin Unlocked por URL ni controles de sesión/publicación demo, consola sin errores. |
| `npm run typecheck:contracts` | Falla por problemas preexistentes, separados del frontend. |
| `git diff --check` | Sin errores. |

## Errores heredados

- Hardhat sigue fallando en `typecheck:contracts`: redes con configuración antigua, import de `ethers` incompatible y tipos/dependencias Chai/Mocha faltantes. No son errores frontend; no se modificaron esos archivos.
- El build conserva advertencias del SDK MetaMask sobre almacenamiento React Native opcional y de Node sobre el módulo Tailwind/localStorage. No se instalaron dependencias móviles para ocultarlas.
- La CI heredada todavía incluye el toolchain de contratos y requiere una reparación independiente.

## Archivos nuevos para el checkpoint

Todos forman parte del bloque y deben revisarse junto con los cambios tracked:

```text
components/content/create-publication.tsx
components/content/creator-collection.tsx
components/content/demo-publications.tsx
components/content/publication-editor.tsx
components/content/session-content.tsx
components/membership/membership-flow.tsx
components/transaction/explorer-reference.tsx
components/transaction/transaction-status.tsx
components/ui/form-field.tsx
components/wallet/demo-session-controls.tsx
components/wallet/network-status.tsx
components/wallet/wallet-status.tsx
docs/continuation-status.md
docs/persona-3-checkpoint.md
docs/task-12-subscribe.md
features/demo/creator-data.ts
features/demo/deadline.ts
features/demo/membership-runtime.ts
features/demo/premium-action.ts
features/demo/publishing.ts
features/demo/session.ts
features/demo/subscription.ts
features/demo/use-session.ts
lib/web3/demo.ts
lib/web3/explorers.ts
lib/web3/integration.ts
scripts/check-demo-flows.ts
tsconfig.demo.json
```

## Eliminaciones para el checkpoint

Se comprobaron referencias antes de retirar estos archivos obsoletos. Sus versiones anteriores permanecen recuperables en Git:

```text
components/membership/access-preview-controls.tsx
features/publications/development-access-preview.ts
features/publications/create-preview.ts
lib/web3/unlock.ts
lib/web3/avalanche.ts
lib/web3/memberships.ts
```

Los dos primeros permitían elegir Unlocked por URL. El tercero calculaba el hash del cuerpo en el formulario antiguo. Los tres helpers Web3 no tenían consumidores y conservaban checkout/RPC y tiers de Avalanche ajenos al flujo mock actual; los sustituyen el adaptador, las redes compartidas y los helpers de explorer.

`git diff --stat` no cuenta archivos untracked. `git add -p` tampoco los agrega por sí solo: revisarlos explícitamente antes de preparar el commit. No se ha ejecutado git add ni commit.

Mensaje recomendado: `feat(frontend): complete verified mock creator and subscriber flows`

Para retomar más adelante: “Lee docs/persona-3-checkpoint.md, inspecciona git status y git diff, conserva el working tree y continúa con el alcance que te indique; no hagas commit sin mi instrucción”.

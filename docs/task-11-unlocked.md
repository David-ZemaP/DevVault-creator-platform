### Tarea 11 — Implementar el estado Unlocked

**Registro histórico, sustituido por el [checkpoint Persona 3](persona-3-checkpoint.md).** El selector URL descrito abajo fue retirado. `previewAccess=unlocked` y `unlocked=true` ahora permanecen Locked incluso en desarrollo hasta completar el flujo mock.

**Objetivo**

Mostrar el cuerpo premium ficticio con la confirmación visible `CONTENT UNLOCKED`, preservando la preview pública. El modo de lectura usa el ancho del layout existente y la escala de tipografía y espaciado de Tailwind. El estado exitoso reutiliza el color emerald que ya utiliza la aplicación.

El selector solo existe en desarrollo. El repositorio público sigue sin incluir el cuerpo premium: una función exclusiva del servidor carga el fixture del ID solicitado solo ante `previewAccess=unlocked` y `NODE_ENV=development`. El build de producción ignora el parámetro y permanece Locked. Los enlaces del selector desactivan prefetch para no anticipar la descarga del cuerpo ficticio desde Locked.

**Archivos que probablemente modificaremos**

- `app/content/[id]/page.tsx`: composición de los estados.
- `components/content/unlocked-content.tsx`: confirmación y lectura del cuerpo como texto, sin interpretar HTML.
- `components/membership/access-preview-controls.tsx`: navegación de escenarios de desarrollo.
- `features/publications/development-access-preview.ts`: selección del fixture, marcada `server-only`.
- `lib/mocks/premium-content.ts`: aclaración del uso del fixture existente.
- `scripts/check-access-preview.mjs`: regresiones HTTP para desarrollo y producción.
- README y documentación de checkpoints.

**Prompt de ejecución**

> Revisa únicamente la Tarea 11. Valida el estado visual Unlocked, la correspondencia entre publicación y contenido ficticio, el retorno a Locked y que el selector de desarrollo no habilite acceso en producción. Conserva el diseño existente. No implementes compras, memberships reales ni persistencia. Ejecuta las verificaciones disponibles y detente para mi validación.

**Qué NO debemos hacer todavía**

No implementar Subscribe, firmas, transacciones, comprobación de memberships, persistencia de permisos ni backend. El mensaje `Demo access · No membership verified` distingue esta presentación del futuro resultado de `hasMembership()`.

El parámetro URL no es autorización. Cualquiera que use el servidor de desarrollo puede solicitar los fixtures, que deben seguir siendo completamente ficticios. Quitar el parámetro vuelve a Locked. Recargar conservando el parámetro mantiene la misma selección visual, sin guardar permisos en cookies ni almacenamiento del navegador. Un navegador que ya recibió una respuesta Unlocked puede conservarla en su historial o caché: regresar a Locked no revoca los bytes recibidos.

**Checklist de pruebas manuales**

1. Ejecutar `npm run dev` y abrir `http://localhost:3000/content/membership-experiences`.
2. Comprobar que comienza Locked, con Subscribe deshabilitado y sin cuerpo premium.
3. En `Development preview`, presionar **Unlocked**. Verificar `CONTENT UNLOCKED`, la aclaración de simulación y el cuerpo ficticio. El panel de compra debe desaparecer.
4. Presionar **Locked**. El cuerpo premium debe desaparecer; debe volver el panel Locked.
5. Repetir con `/content/creator-toolkit` y `/content/behind-the-proof`. Cada publicación debe mostrar su propio contenido.
6. Recargar ambas variantes y usar Atrás/Adelante. La URL y el estado mostrado deben corresponder. Abrir desde Explore debe comenzar Locked.
7. Probar `?previewAccess=invalid` y `?previewAccess=unlocked&previewAccess=locked`: ambos deben permanecer Locked.
8. Probar `/content/missing?previewAccess=unlocked`: debe mostrar 404.
9. Revisar a 375 px y en escritorio: sin scroll horizontal, cuerpo legible y confirmación que no se trunca. Probar el selector con Tab y Enter, comprobando el foco visible.
10. Revisar consola del navegador por errores de hidratación. En Network, una respuesta Locked no debe contener `Premium demo:`. El cuerpo ficticio sí aparecerá en la respuesta explícita Unlocked de desarrollo.
11. Ejecutar `npm run typecheck`, `npm run lint` y `npm run build`; revisar terminal.

Pruebas HTTP reproducibles, manteniendo el servidor de desarrollo iniciado:

```bash
node scripts/check-access-preview.mjs development http://localhost:3000
```

Después del build, iniciar producción en otra terminal:

```bash
npm run start -- --port 3001
```

Y comprobarla desde otra terminal:

```bash
node scripts/check-access-preview.mjs production http://localhost:3001
```

Abrir también `http://localhost:3001/content/membership-experiences?previewAccess=unlocked`: no debe aparecer el selector ni el cuerpo premium; Subscribe debe estar deshabilitado.

**Criterio de éxito**

Locked y Unlocked pueden probarse de forma determinista en desarrollo, sin compra ni verificación real; el contenido público y los bundles cliente no incluyen los fixtures premium; producción no habilita el selector.

Verificaciones realizadas: TypeScript y build aprobados; lint sin errores y con las dos advertencias heredadas. Doce casos HTTP pasaron en cada entorno. Sin fixtures premium en los 28 scripts cliente revisados en desarrollo ni en los 12 de producción; tampoco se encontraron en `.next/static`. Persisten las advertencias de build de dependencias documentadas en el checkpoint anterior. Revisión visual, navegación interactiva y consola del navegador pendientes porque no había navegador disponible en la sesión.

**Checkpoint Git recomendado**

Los cambios del bloque anterior siguen sin commit. Revisar y guardar primero ese checkpoint, o revisar ambos juntos para evitar un commit parcial que omita sus dependencias. No se creó ningún commit automáticamente.

Para esta tarea, después de guardar la base:

```bash
git diff --check
git diff -- 'app/content/[id]/page.tsx' lib/mocks/premium-content.ts README.md docs/
git add 'app/content/[id]/page.tsx' components/content/unlocked-content.tsx components/membership/access-preview-controls.tsx features/publications/development-access-preview.ts lib/mocks/premium-content.ts scripts/check-access-preview.mjs docs/task-11-unlocked.md docs/frontend-architecture.md docs/frontend-checkpoint.md README.md
git diff --cached
git commit -m "feat: add development-only unlocked content preview"
```

Después de tu validación sigue la **Tarea 12 — flujo mock de Subscribe**.

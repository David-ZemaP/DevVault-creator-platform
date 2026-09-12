# Subscribe demo

El flujo actual sustituye la primera versión que navegaba directamente al preview por URL.

1. En desarrollo, abrir `/content/membership-experiences` desde Explore.
2. Comprobar Locked, cuenta demo conectada y HashKey Testnet seleccionada.
3. Pulsar **Subscribe (demo)** y revisar **Awaiting confirmation**. Cancel vuelve a Locked.
4. Elegir escenario y **Confirm transaction**. Durante Pending los botones están deshabilitados.
5. `purchaseMembership()` entrega una referencia **Simulation ID**; `hasMembership()` verifica el acceso.
6. Solo ante `true` el servicio solicita el contenido ficticio y muestra **Membership detected / CONTENT UNLOCKED**.
7. Si la membership se demora o falla la lectura, **Retry verification** conserva la compra y no vuelve a pagar.

Escenarios: success, rejected transaction, failed transaction, membership delayed y verification read error. El panel global permite probar disconnected, connecting, connected, wallet rejection, cuenta distinta, red no soportada, cambio de red y fallo/reintento del cambio.

Recargar elimina el estado de sesión; los parámetros URL no desbloquean. Desconectar o cambiar cuenta/red invalida la presentación del contenido. Los bytes ya recibidos pueden permanecer en la caché del navegador.

Producción no muestra Subscribe demo ni controles internos. La acción que entrega fixtures devuelve access-denied en producción. La demo no es autenticación real: no usar contenido privado auténtico.

Implementación, pruebas e interfaces futuras: [checkpoint Persona 3](persona-3-checkpoint.md).

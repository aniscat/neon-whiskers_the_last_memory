# Notas del proyecto

## TODO SE EJECUTA EN DOCKER

No instales Node, npm ni dependencias en la máquina del usuario. Todos los comandos van por
Docker:

```bash
# Juego completo (Express sirve el cliente y el agente) -> http://localhost:8080
docker compose up -d --build game
docker compose logs -f game
docker compose down

# Desarrollo con recarga en caliente -> http://localhost:5173
docker compose --profile dev up dev

# Herramientas: tests, typecheck, build. El --build recompila si cambió el código.
docker compose --profile tools run --rm --build tools npm test
docker compose --profile tools run --rm tools npm run typecheck
docker compose --profile tools run --rm tools npx vitest run tests/geometry.test.ts
```

Los scripts de `package.json` (`npm run dev`, `assets`, `typecheck`, `test`, `build`) existen para
ejecutarse **dentro** del contenedor, no en el host.

### El IDE marca errores falsos: es esperado

No hay `node_modules` en el host, así que el servidor de TypeScript del editor no encuentra las
declaraciones de tipos y muestra cosas como:

```
Cannot find module 'phaser' or its corresponding type declarations.
Property 'cameras' does not exist on type 'TowerBossScene'.
Parameter '_p' implicitly has an 'any' type.
```

**Todos son falsos positivos en cascada del primero.** Sin los tipos de Phaser, `extends
Phaser.Scene` se queda sin tipo y de ahí salen los demás. La única verdad sobre los tipos es:

```bash
docker compose --profile tools run --rm --build tools npm run typecheck
```

Si ese comando pasa, el código está bien. No "arregles" estos avisos añadiendo `any`, castings o
`@ts-ignore`: romperías el tipado real que sí se comprueba en el contenedor.

(Decisión del usuario: se prefiere convivir con los avisos antes que tener dependencias en el host.
Si algún día se quieren recuperar los tipos sin instalar nada, se pueden extraer del contenedor con
`docker cp`.)

## Verificación antes de dar algo por terminado

1. `docker compose --profile tools run --rm --build tools npm run typecheck`
2. `docker compose --profile tools run --rm tools npm test` (63 pruebas)
3. `docker compose up -d --build game` y comprobar `/api/health`
4. Smoke test en navegador: menú → nueva partida → ESC en la intro → moverse → saltar → hablar
   con un gato → caerse al vacío y ver que el collar baja y Nova reaparece.
5. Confirmar que la clave no está en el bundle: `docker run --rm neon-whiskers:latest sh -c "grep -rl GEMINI /app/dist"` no debe devolver nada.

## Decisiones que conviene no deshacer

- **Phaser 3.90, no 4.x.** Phaser 4 es una reescritura con API distinta; el código usa APIs de 3.x.
- **Vite 7, no 8.** La 8.2.0 se publicó hace pocos días; se evita a propósito.
- **El servidor no muta el estado del juego.** Las herramientas del agente devuelven `effects[]` y
  el cliente los aplica sobre `GameState`, que es la única fuente de verdad.
- **`shared/lore.ts` es canónico.** El agente solo puede hablar de lo que existe ahí. Añadir un
  fragmento nuevo implica añadirlo también a la zona correspondiente en `src/world/zones/`.
- **El juego debe ser jugable sin `GEMINI_API_KEY`.** Hay dos niveles de reserva:
  `server/agent/fallback.ts` (sin clave) y `AgentClient.offline()` (sin servidor).
- **`preUpdate` en subclases de sprite debe ser `protected override`**, o TypeScript se queja.
- **`this.body` es `Body | StaticBody | null`.** Usar el getter `arcadeBody` en lugar de castear
  en cada línea.
- **`Phaser.Scene` no llama a un método `shutdown()` automáticamente.** Hay que registrar
  `this.events.once(Phaser.Scenes.Events.SHUTDOWN, ...)`.
- **El orden del array `scene` en `main.ts` es el orden de dibujado.** Cualquier escena que se
  superponga al juego (`DialogueScene`, `MemoryFragmentScene`, `HowToPlayScene`) tiene que ir
  DESPUÉS de `GameScene` y `HUDScene`, o el juego la tapará por completo sin dar ningún error.
- **La geometría de los niveles se valida en `tests/geometry.test.ts`** contra las cotas de
  `src/core/physics.ts`. Si cambias `RUN_SPEED` o `JUMP_VELOCITY`, los tests dirán qué zonas se
  rompen. Una plataforma que solo se alcance con una habilidad debe declararlo con `reachedWith`.
- **El canvas mide `GAME_WIDTH * RENDER_SCALE` y cada cámara usa ese zoom.** Toda escena visible
  DEBE llamar a `applyRenderScale(this)` al principio de `create()`, o se dibujará al doble de
  tamaño y descuadrada. Es lo que permite que el texto se vea nítido: `ui/text.ts` pide la fuente
  al doble de tamaño y la dibuja a mitad de escala, quedando 1:1 con los píxeles reales.
- **Los anchos de `setWordWrapWidth` y `setLineSpacing` van multiplicados por `RENDER_SCALE`**,
  porque operan en el espacio interno del texto, que está escalado.
- **El borde inferior del mundo no colisiona** (`setBoundsCollision(true, true, true, false)` en
  `LevelBuilder`). Es lo que hace posible la muerte por caída; con la colisión activada el jugador
  aterrizaba en un suelo invisible y en z2 (sin suelo) quedaba atrapado sin salida.
- **La vida es `GameState.integridad`** (4 segmentos). Prensas, láseres y enemigos restan 1; caer al
  vacío, al agua o sobre púas resta 2 y devuelve a Nova de inmediato. Al llegar a 0 se reconstruye
  en el último checkpoint y se restaura entera; no hay pantalla de game over.
- **Un checkpoint solo se guarda en un punto seguro** (`isSafeSpot`, 20 px de margen respecto a
  cualquier peligro). Estar "en el suelo" NO basta: en z1 las púas se apoyan encima del suelo, así
  que el checkpoint caía sobre ellas y se moría en bucle. Además, si se muere 3 veces en menos de
  3 s, el checkpoint se descarta y se vuelve al inicio de la zona, y tras reaparecer hay 1,4 s de
  invulnerabilidad (`Player.grantGrace`).

## Medidas reales de los sprites

Medidas leídas de la cabecera IHDR de los PNG, ya reflejadas en `src/core/assets.ts`:

| Sheet | Tamaño | Frames |
|---|---|---|
| `cats/*/idle.png` | 224x32 | 7 de 32x32 |
| `cats/xmas/idle.png` | 448x32 | 14 de 32x32 |
| `cats/*/jump.png` | 416x32 | 13 de 32x32 |
| `props/mouse.png` | 158x32 | 4 de 39x32 |
| `props/ball-*.png` | 120x16 | 5 de 24x16 |

`auditSheets()` avisa por consola en el arranque si un PNG deja de coincidir con estas medidas.
`?debug=sheets` lo comprueba visualmente.

## Cosas pendientes conocidas

- Los enemigos no se pueden derrotar, solo esquivar (por diseño hasta la pelea final).
- Los acertijos se resuelven pisando placas; el enunciado narrativo de cada uno es más rico que
  su implementación mecánica.
- No hay soporte de gamepad ni remapeo de teclas.
- La escalada de paredes usa el sprite de salto rotado; se nota si se mira de cerca.

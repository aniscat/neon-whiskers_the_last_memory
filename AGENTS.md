# Notas del proyecto

## Comandos

```bash
npm install
npm run assets       # copia los sprites de AllCatsDemo/CatMaterialsDEMO a public/assets
npm run dev          # Vite (:5173) + servidor del agente (:8787)
npm run typecheck    # tsc --noEmit
npm run test         # vitest (31 pruebas: bucle del agente, herramientas, lore y niveles)
npm run build        # typecheck + build de producción a dist/
```

Docker:

```bash
docker compose up --build game            # producción, http://localhost:8080
docker compose --profile dev up dev       # desarrollo con recarga, http://localhost:5173
docker build --target build -t nw:test .  # imagen con devDependencies, para correr los tests
```

## Verificación antes de dar algo por terminado

1. `npm run typecheck`
2. `npm run test`
3. `npm run build`
4. Smoke test en navegador: menú → nueva partida → ESC en la intro → moverse → hablar con un gato.
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

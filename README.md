# Neon Whiskers: The Last Memory

Juego de plataformas 2D cyberpunk narrativo basado en `Historia central.md`. Los gatos NPC no
tienen diálogos escritos: son **agentes de IA con tool use** sobre Google Gemini, servidos desde un
backend Express que decide en tiempo real qué herramientas usar para consultar el estado de la
partida, entregar fragmentos de memoria, dar pistas del acertijo, corromper la realidad o
despedirse para siempre.

## Arrancar con Docker (recomendado)

No necesitas instalar Node ni nada en tu máquina.

```bash
# 1. (Opcional) Poner tu clave de Gemini
cp .env.example .env      # y rellena GEMINI_API_KEY

# 2. Construir y levantar
docker compose up --build game
```

Abre **http://localhost:8080**.

Sin `GEMINI_API_KEY` el juego funciona igual: los NPC usan un banco de diálogos escritos a mano.
Con clave, cada conversación es generada por el agente y sus herramientas afectan al mundo.

Comandos útiles:

```bash
docker compose logs -f game        # ver logs
docker compose down                # parar
docker compose down -v             # parar y borrar la memoria del agente
docker compose --profile dev up dev   # desarrollo con recarga en caliente (:5173)
```

Tests y typecheck, también sin instalar nada:

```bash
docker compose --profile tools run --rm --build tools npm test
docker compose --profile tools run --rm tools npm run typecheck
```

## Cómo jugar

Hay un tutorial dentro del juego: la opción **CÓMO JUGAR** del menú, y la tecla **H** en
cualquier momento de la partida (funciona como pausa). Además, la zona 1 va enseñando cada
mecánica con pistas que aparecen al acercarte.

| Tecla | Acción | Disponible desde |
|---|---|---|
| ← → | Moverse | inicio |
| ESPACIO | Saltar | inicio |
| ESPACIO en el aire | Doble salto | primeros metros de la zona 1 |
| E | Hablar con un gato / hackear una puerta | inicio |
| H | Abrir la ayuda (pausa) | inicio |
| ESC | Salir al menú | inicio |
| SHIFT | Dash | zona 2 |
| ↑ contra una pared | Escalar | zona 3 |
| Q | Invertir la gravedad | zona 5 |
| F | Crear plataforma holográfica | zona 6 |
| R | Controlar drones | zona 7 |

En el diálogo puedes escribir libremente, o pulsar `1`/`2`/`3` para respuestas rápidas.

### Objetivo

Llegar a la Torre de la Memoria atravesando siete distritos. Cada uno te da una habilidad nueva
que abre el diseño del siguiente. Recoge los rombos de datos (fragmentos de memoria) y habla con
los gatos: pueden darte pistas, recuerdos, o despedirse para siempre.

### Vida

Arriba a la izquierda está el **COLLAR**: cuatro segmentos, la vida de Nova.

- Pinchos, prensas, láseres y enemigos restan **1** segmento.
- Caer al vacío o al agua resta **2** y te devuelve de inmediato al último punto firme.
- Tras un golpe hay unos 0,7 s de invulnerabilidad (Nova parpadea).
- Al llegar a **0** el collar se reconstruye entero en el último punto seguro. **No hay game over**
  ni vidas que se agoten: el juego no te expulsa nunca.
- Cada zona nueva empieza con el collar completo.

### Cómo usar la IA

En cada distrito hay **un gato con un aura de color** y su nombre encima. Acércate hasta que
aparezca `[E] hablar` y pulsa **E**.

Se abre un chat. **Escribe lo que quieras** y pulsa ENTER: el gato contesta en personaje. No hay
diálogos pregrabados; responde un modelo de lenguaje (Gemini) que además puede **usar herramientas**
para actuar sobre la partida: darte un fragmento de memoria, revelarte una pista del acertijo de la
zona, cambiar de humor, corromper la realidad o despedirse para siempre. Recuerda lo que hablasteis
en encuentros anteriores.

Si no quieres escribir, pulsa **1**, **2** o **3** para preguntas rápidas.

La pantalla de ayuda (**H**) te dice si el agente está activo o en modo de reserva. Sin
`GEMINI_API_KEY` los gatos usan diálogos escritos a mano y verás `sin conexión` en el bocadillo.

## Diseño de niveles y física

Los saltos están calculados, no tanteados (`src/core/physics.ts`):

| Magnitud | Valor |
|---|---|
| Altura de un salto | 61 px |
| Alcance horizontal de un salto | 95 px |
| Altura con doble salto | 121 px |
| Alcance con doble salto | 143 px |

`tests/geometry.test.ts` comprueba que **toda** superficie de **todas** las zonas sea alcanzable
con esas cotas. Si una plataforma solo se alcanza usando una habilidad, hay que declararlo con
`reachedWith: 'holoPlatform'` y el test verifica que Nova ya tenga esa habilidad al llegar.

## El agente y sus herramientas

`POST /api/agent/chat` recibe el mensaje del jugador más una instantánea del estado y devuelve
`{ reply, effects, toolTrace }`. El servidor **nunca** muta el estado del juego: las herramientas
que afectan al mundo devuelven efectos que el cliente aplica sobre su propio `GameState`.

| Herramienta | Qué hace |
|---|---|
| `consultar_estado_jugador` | Zona, habilidades, fragmentos, corrupción, banderas |
| `recuperar_fragmento_memoria` | Busca en el archivo canónico de recuerdos |
| `otorgar_fragmento_memoria` | Entrega un fragmento a Nova |
| `consultar_historial_conversacion` | Lo que ya habló con Nova en encuentros previos |
| `registrar_recuerdo` | Guarda un resumen para el futuro |
| `revelar_pista` | Pista del acertijo, en tres niveles de concreción |
| `cambiar_emocion` | Cambia su tinte y su postura en pantalla |
| `corromper_realidad` | Degrada la simulación (glitches, lluvia invertida) |
| `despedirse_para_siempre` | Se desintegra y no vuelve a aparecer |

`shared/lore.ts` es la fuente canónica: si un recuerdo no está ahí, el agente no puede inventarlo.
Los prompts de `server/agent/personas.ts` le prohíben revelar el giro final hasta que el estado
indica `verdadRevelada`.

## Estructura

```
shared/          tipos, lore y fichas de NPC compartidos por cliente y servidor
src/core/        estado, guardado, event bus, carga de sprites
src/entities/    Nova, gatos NPC, enemigos, recogibles, puertas
src/abilities/   metadatos de las siete habilidades
src/world/       formato de nivel, constructor, arte procedural, las 7 zonas
src/scenes/      menú, intro, juego, HUD, diálogo, jefe, revelación, final
src/dialogue/    cliente del agente y aplicación de efectos
src/audio/       música y ambiente sintetizados con WebAudio
server/agent/    bucle de tool use, herramientas, personalidades, memoria
```

## Assets

- Sprites de gatos: `AllCatsDemo` (11 variantes, 32x32, `idle` 7 frames / `jump` 13).
- Objetos: `CatMaterialsDEMO` (ratón, pelotas, cama, cuencos).
- Todo lo demás —ciudad, plataformas, lluvia, enemigos, glitches, UI y música— está **generado
  por código**. No hay tilesets ni archivos de audio.

Los packs son versiones "DEMO/Free"; revisa sus términos antes de distribuir el juego.

## Depuración

Parámetros de query:

- `?debug=sheets` — verifica visualmente los frames de cada sprite
- `?debug=agent` — muestra en consola y en pantalla qué herramientas usó el agente
- `?debug=physics` — dibuja los cuerpos de colisión

## Verificación

```bash
npm run typecheck
npm run test
npm run build
```

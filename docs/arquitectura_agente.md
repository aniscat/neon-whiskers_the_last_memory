# Arquitectura del Agente de IA

En *Neon Whiskers: The Last Memory*, los gatos NPC no tienen diálogos estáticos pregrabados. En su lugar, el juego utiliza un **agente de IA basado en Large Language Models (Gemini)** con capacidad de ejecución de herramientas (*tool use*). Esto permite que cada conversación se adapte en tiempo real y que las decisiones o la actitud de los gatos alteren dinámicamente el mundo del juego.

A continuación se detalla el flujo arquitectónico y de comunicación entre el cliente y el servidor.

---

## 1. El Cliente: La Única Fuente de Verdad (`GameState`)

El estado del juego reside exclusivamente en el cliente en la clase [GameStateStore](file:///c:/Users/gabya/OneDrive/Documentos/IPIAM/PROYECTO/neon-whiskers_the_last_memory/src/core/GameState.ts). El servidor **nunca muta directamente** el estado del juego.

Cuando el jugador interactúa con un gato NPC:
1. El cliente congela los controles de Nova y lanza la escena de diálogo [DialogueScene](file:///c:/Users/gabya/OneDrive/Documentos/IPIAM/PROYECTO/neon-whiskers_the_last_memory/src/scenes/DialogueScene.ts).
2. Se serializa una instantánea del estado de la partida ([GameStateSnapshot](file:///c:/Users/gabya/OneDrive/Documentos/IPIAM/PROYECTO/neon-whiskers_the_last_memory/shared/types.ts)), que incluye:
   * **Zona actual** (`zona`) y habilidades desbloqueadas (`habilidades`).
   * **Fragmentos de memoria** recogidos por el jugador (`fragmentos`).
   * **Nivel de corrupción** de la simulación (`corrupcion`).
   * **Banderas de la historia** (`flags`) como si se ha revelado el secreto final o qué NPCs ya se han disuelto.
3. El cliente envía el mensaje escrito por el jugador y el snapshot al servidor mediante una petición `POST` a `/api/agent/chat`.

---

## 2. El Servidor: Orquestación del Agente (`server/agent`)

El backend Express recibe la petición y la canaliza a través del bucle del agente.

```mermaid
graph TD
    Client[Cliente: GameScene/DialogueScene] -->|POST /api/agent/chat con GameStateSnapshot| Server[Servidor: Express]
    Server -->|Inicializa Prompt de Sistema| Persona[Persona & Reglas de la Zona]
    Persona -->|Genera Llamada a API| Gemini[Google Gemini API]
    Gemini -->|Decide usar Herramienta| ToolCall[Ejecución de Herramienta]
    ToolCall -->|Resultado de la Herramienta| Gemini
    Gemini -->|Genera Respuesta Final y Efectos| Server
    Server -->|Responde { reply, effects, toolTrace }| Client
    Client -->|Aplica efectos en GameState| StateChange[Actualización de UI, Física y Entorno]
```

### Prompt del Sistema y Personalidades
El servidor construye el prompt de sistema dinámicamente en [personas.ts](file:///c:/Users/gabya/OneDrive/Documentos/IPIAM/PROYECTO/neon-whiskers_the_last_memory/server/agent/personas.ts) mediante la función `buildSystemPrompt`:
* **Reglas Comunes:** Define las directrices estrictas del juego (conversaciones breves de 1-3 frases en español, sin emojis, markdown ni romper la ficción de personaje).
* **Ficha del NPC:** Carga la personalidad y tono específico del gato (Óxido = Duelo, Nadie = Olvido, Sirena = Miedo, Tráfico = Codicia, Colmillo = Ira, Semilla = Esperanza, Ámbar = Aceptación, Mother = Cuidado/Cansancio).
* **El Secreto:** Reglas sobre cuándo el NPC puede admitir que todo es una simulación (bloqueado hasta que `verdadRevelada` sea verdadero en los flags).
* **Estado Actual:** Datos contextuales como la zona, el acertijo pendiente y la corrupción actual de la simulación.

### Herramientas del Agente (Tool Use)
El agente dispone de una serie de herramientas declaradas en [tools.ts](file:///c:/Users/gabya/OneDrive/Documentos/IPIAM/PROYECTO/neon-whiskers_the_last_memory/server/agent/tools.ts) que puede llamar antes de generar su respuesta final:
* **`consultar_estado_jugador`**: Devuelve detalles del snapshot del jugador.
* **`recuperar_fragmento_memoria`**: Busca un fragmento en el archivo canónico de lore ([lore.ts](file:///c:/Users/gabya/OneDrive/Documentos/IPIAM/PROYECTO/neon-whiskers_the_last_memory/shared/lore.ts)).
* **`otorgar_fragmento_memoria`**: Entrega un fragmento de memoria a Nova.
* **`consultar_historial_conversacion`**: Recupera los diálogos anteriores del mismo gato en encuentros previos.
* **`registrar_recuerdo`**: Escribe un resumen de la conversación actual para recuperarlo en el futuro.
* **`revelar_pista`**: Revela pistas del acertijo de la zona (en tres niveles de detalle).
* **`cambiar_emocion`**: Altera el estado emocional del gato.
* **`corromper_realidad`**: Degrada la simulación sumando corrupción.
* **`despedirse_para_siempre`**: Disuelve al gato de la escena de forma permanente.

---

## 3. Retorno y Aplicación de Efectos en el Cliente

Cuando Gemini termina su ejecución, el servidor responde con un JSON conteniendo:
* `reply`: El texto final que dirá el gato en el bocadillo.
* `effects`: Un array de efectos que el agente ha decidido aplicar (ej. `{ type: 'corruptReality', amount: 0.05 }`).
* `toolTrace`: Lista de herramientas utilizadas (para propósitos de depuración en desarrollo).

El cliente procesa este array en [applyEffects](file:///c:/Users/gabya/OneDrive/Documentos/IPIAM/PROYECTO/neon-whiskers_the_last_memory/src/dialogue/effects.ts):
* **`corruptReality`**: Aumenta `GameState.corrupcion`, lo que incrementa la intensidad de los glitches visuales, puede invertir la lluvia (hacia arriba a partir de >0.55), altera los carteles de neón del fondo y hace que a partir de >0.6 los enemigos dejen de atacar a Nova y solo se queden observándola fijamente.
* **`grantAbility`**: Desbloquea una nueva habilidad (como el Dash, doble salto, o escalar paredes).
* **`npcDissolve`**: Activa la animación de partículas y desintegra al gato de la pantalla al cerrar el bocadillo.

---

## 4. Modo Offline y Reserva (*Fallback*)

Para garantizar que el juego funcione sin depender de conexiones o claves externas, existen dos niveles de contingencia:
1. **Sin servidor (`AgentClient.offline()`):** Si el servidor backend no está levantado, el cliente utiliza diálogos locales pregrabados definidos estáticamente.
2. **Sin API Key de Gemini (`server/agent/fallback.ts`):** Si el servidor está levantado pero no se ha configurado la variable de entorno `GEMINI_API_KEY`, el backend simula el comportamiento del agente seleccionando diálogos pregrabados específicos según la emoción del gato y el estado de la partida, permitiendo experimentar la entrega de fragmentos y pistas sin llamadas externas.

/**
 * Tipos compartidos entre el cliente (Phaser) y el servidor (agente Gemini).
 * No importar nada de Phaser ni de Node aquí.
 */

export type ZoneId = 'z1' | 'z2' | 'z3' | 'z4' | 'z5' | 'z6' | 'z7' | 'tower';

export type AbilityId =
  | 'doubleJump'
  | 'dash'
  | 'wallClimb'
  | 'hack'
  | 'gravityFlip'
  | 'holoPlatform'
  | 'droneControl';

export type NpcId =
  | 'duelo'
  | 'olvido'
  | 'miedo'
  | 'codicia'
  | 'ira'
  | 'esperanza'
  | 'aceptacion'
  | 'mother';

/** Estado emocional que el agente puede fijar; afecta tono, tinte y animación. */
export type Emotion =
  | 'neutral'
  | 'duelo'
  | 'olvido'
  | 'miedo'
  | 'codicia'
  | 'ira'
  | 'esperanza'
  | 'aceptacion'
  | 'verdad';

/** Banderas narrativas globales. */
export interface StoryFlags {
  /** El jugador ha llegado a la Torre de la Memoria: los NPC ya pueden hablar del giro. */
  torreAlcanzada: boolean;
  /** MOTHER ha mostrado la verdad sobre Noa. */
  verdadRevelada: boolean;
  /** El núcleo de MOTHER ha sido destruido. */
  nucleoDestruido: boolean;
  /** Zonas cuyo acertijo ya está resuelto. */
  acertijosResueltos: ZoneId[];
  /** NPCs que ya se despidieron para siempre. */
  npcsDisueltos: NpcId[];
}

/**
 * Instantánea del estado que el cliente envía al servidor en cada turno de
 * diálogo. El cliente sigue siendo la fuente de verdad; el servidor solo lee.
 */
export interface GameStateSnapshot {
  zona: ZoneId;
  habilidades: AbilityId[];
  fragmentos: string[];
  /** 0..1 — cuánto se ha degradado la simulación. */
  corrupcion: number;
  flags: StoryFlags;
}

/**
 * Efectos que el agente solicita mediante tool use y que el cliente aplica.
 * El servidor nunca muta el estado del juego directamente.
 */
export type AgentEffect =
  | { type: 'grantFragment'; id: string }
  | { type: 'grantAbility'; ability: AbilityId }
  | { type: 'setEmotion'; emotion: Emotion }
  | { type: 'showHint'; text: string }
  | { type: 'corruptReality'; amount: number }
  | { type: 'solvePuzzle'; zone: ZoneId }
  | { type: 'npcDissolve'; npcId: NpcId };

/** Una llamada a herramienta ejecutada durante el turno (visible con ?debug=agent). */
export interface ToolTraceEntry {
  name: string;
  args: Record<string, unknown>;
  result: unknown;
}

export interface AgentChatRequest {
  npcId: NpcId;
  playerMessage: string;
  gameState: GameStateSnapshot;
}

export interface AgentChatResponse {
  reply: string;
  effects: AgentEffect[];
  toolTrace: ToolTraceEntry[];
  /** true si la respuesta viene del banco de diálogos escritos a mano. */
  fallback: boolean;
}

export const DEFAULT_FLAGS: StoryFlags = {
  torreAlcanzada: false,
  verdadRevelada: false,
  nucleoDestruido: false,
  acertijosResueltos: [],
  npcsDisueltos: [],
};

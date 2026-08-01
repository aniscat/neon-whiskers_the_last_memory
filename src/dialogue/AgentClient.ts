import { GameState } from '@/core/GameState';
import { NPCS } from '@shared/npcs';
import type { AgentChatResponse, NpcId } from '@shared/types';

/** Reserva local para cuando el propio servidor no está disponible. */
const OFFLINE: Record<string, string[]> = {
  generic: [
    'La señal se va. Vuelve a intentarlo cuando la ciudad respire.',
    'No te oigo bien. Hay demasiado ruido en la red.',
  ],
};

let offlineTurn = 0;

export class AgentUnavailableError extends Error {}

/**
 * Cliente del agente. Llama a `/api/agent/chat` (proxyado a Express en desarrollo).
 * La clave de Gemini nunca sale del servidor.
 */
export const AgentClient = {
  async chat(npcId: NpcId, playerMessage: string, signal?: AbortSignal): Promise<AgentChatResponse> {
    try {
      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          npcId,
          playerMessage,
          gameState: GameState.snapshot(),
        }),
        signal,
      });

      if (!response.ok) {
        throw new AgentUnavailableError(`El servidor respondió ${response.status}`);
      }
      return (await response.json()) as AgentChatResponse;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw error;
      console.warn('[agent] servidor no disponible, se usa diálogo local:', error);
      return this.offline(npcId);
    }
  },

  /** Respuesta local: el saludo escrito a mano y luego líneas genéricas. */
  offline(npcId: NpcId): AgentChatResponse {
    const lineas = [NPCS[npcId].saludo, ...OFFLINE.generic];
    const reply = lineas[offlineTurn++ % lineas.length];
    return { reply, effects: [], toolTrace: [], fallback: true };
  },

  /** Se llama al empezar una partida nueva para limpiar la memoria del agente. */
  async reset() {
    offlineTurn = 0;
    try {
      await fetch('/api/agent/reset', { method: 'POST' });
    } catch {
      /* sin servidor no hay nada que reiniciar */
    }
  },
};

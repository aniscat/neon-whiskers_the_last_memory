import { GameState } from '@/core/GameState';
import { EventBus } from '@/core/EventBus';
import { SaveSystem } from '@/core/SaveSystem';
import { getFragment } from '@shared/lore';
import type { AgentEffect, Emotion } from '@shared/types';

export interface EffectOutcome {
  /** Emoción que debe adoptar el NPC, si el agente la ha cambiado. */
  emotion?: Emotion;
  /** El NPC se ha despedido para siempre: hay que cerrar el diálogo al terminar. */
  dissolve: boolean;
  /** Textos para mostrar en el HUD tras cerrar el bocadillo. */
  notices: string[];
}

/**
 * Aplica los efectos que el agente ha solicitado mediante tool use. El servidor
 * no toca el estado: aquí es donde el mundo cambia de verdad.
 */
export function applyEffects(effects: AgentEffect[]): EffectOutcome {
  const outcome: EffectOutcome = { dissolve: false, notices: [] };

  for (const effect of effects) {
    switch (effect.type) {
      case 'grantFragment': {
        if (GameState.collectFragment(effect.id)) {
          const fragment = getFragment(effect.id);
          outcome.notices.push(`FRAGMENTO RECIBIDO: ${fragment?.titulo ?? effect.id}`);
        }
        break;
      }

      case 'grantAbility': {
        GameState.grantAbility(effect.ability);
        break;
      }

      case 'setEmotion': {
        outcome.emotion = effect.emotion;
        break;
      }

      case 'showHint': {
        EventBus.emit('hint:shown', effect.text);
        break;
      }

      case 'corruptReality': {
        GameState.corrupcion += effect.amount;
        break;
      }

      case 'solvePuzzle': {
        GameState.solvePuzzle(effect.zone);
        break;
      }

      case 'npcDissolve': {
        // La disolución se ejecuta cuando el jugador cierra el bocadillo, para que
        // pueda leer las últimas palabras antes de que el gato desaparezca.
        outcome.dissolve = true;
        break;
      }
    }
  }

  if (effects.length > 0) SaveSystem.save();
  return outcome;
}

import Phaser from 'phaser';
import type { AbilityId, Emotion, NpcId, ZoneId } from '@shared/types';

/**
 * Canal único de comunicación entre gameplay, HUD, diálogo y agente.
 * Evita que las escenas se busquen entre sí por `scene.get()`.
 */
export interface GameEvents {
  'state:changed': [];
  'ability:granted': [AbilityId];
  'fragment:collected': [string];
  'corruption:changed': [number];
  'integrity:changed': [number];
  'player:respawned': [];
  'hint:shown': [string];
  'puzzle:solved': [ZoneId];
  'npc:emotion': [NpcId, Emotion];
  'npc:dissolve': [NpcId];
  'dialogue:open': [NpcId];
  'dialogue:closed': [];
  'zone:completed': [ZoneId];
  'player:died': [];
  'toast': [string];
}

class TypedEmitter extends Phaser.Events.EventEmitter {
  override emit<K extends keyof GameEvents>(event: K, ...args: GameEvents[K]): boolean {
    return super.emit(event as string, ...args);
  }

  override on<K extends keyof GameEvents>(
    event: K,
    fn: (...args: GameEvents[K]) => void,
    context?: unknown,
  ): this {
    return super.on(event as string, fn, context);
  }

  override once<K extends keyof GameEvents>(
    event: K,
    fn: (...args: GameEvents[K]) => void,
    context?: unknown,
  ): this {
    return super.once(event as string, fn, context);
  }

  override off<K extends keyof GameEvents>(
    event: K,
    fn?: (...args: GameEvents[K]) => void,
    context?: unknown,
    once?: boolean,
  ): this {
    return super.off(event as string, fn, context, once);
  }
}

export const EventBus = new TypedEmitter();

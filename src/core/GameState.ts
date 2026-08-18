import { EventBus } from './EventBus';
import { ZONE_ORDER, getFragment } from '@shared/lore';
import {
  DEFAULT_FLAGS,
  type AbilityId,
  type GameStateSnapshot,
  type StoryFlags,
  type ZoneId,
  type NpcId,
} from '@shared/types';

export interface SerializedState {
  version: number;
  zona: ZoneId;
  habilidades: AbilityId[];
  fragmentos: string[];
  corrupcion: number;
  flags: StoryFlags;
  integridad: number;
  /** Segundos jugados, para los créditos. */
  tiempo: number;
}

export const SAVE_VERSION = 2;

/** Integridad máxima del collar de NOVA-7. Cada golpe resta uno. */
export const MAX_INTEGRITY = 4;

/**
 * Estado global de la partida. Es la única fuente de verdad: el servidor del
 * agente recibe copias de solo lectura y devuelve efectos que se aplican aquí.
 */
class GameStateStore {
  zona: ZoneId = 'z1';
  habilidades = new Set<AbilityId>();
  fragmentos = new Set<string>();
  flags: StoryFlags = structuredClone(DEFAULT_FLAGS);
  tiempo = 0;
  /** Integridad restante. Al llegar a 0, Nova se reconstruye en el último punto seguro. */
  integridad = MAX_INTEGRITY;

  #corrupcion = 0;

  get corrupcion() {
    return this.#corrupcion;
  }

  /** La corrupción nunca baja por debajo del suelo que marca el progreso de zona. */
  set corrupcion(value: number) {
    const clamped = Math.min(1, Math.max(this.corruptionFloor, value));
    if (clamped === this.#corrupcion) return;
    this.#corrupcion = clamped;
    EventBus.emit('corruption:changed', clamped);
    this.#touch();
  }

  /** Cada zona superada degrada un poco más la simulación, de forma irreversible. */
  get corruptionFloor() {
    return Math.min(0.85, this.zoneIndex * 0.1);
  }

  get zoneIndex() {
    return Math.max(0, ZONE_ORDER.indexOf(this.zona));
  }

  has(ability: AbilityId) {
    return this.habilidades.has(ability);
  }

  /** Resta integridad. Devuelve true si Nova se ha quedado a cero. */
  damage(amount = 1) {
    this.integridad = Math.max(0, this.integridad - amount);
    EventBus.emit('integrity:changed', this.integridad);
    this.#touch();
    return this.integridad === 0;
  }

  /** Restaura la integridad al reconstruirse o al cambiar de zona. */
  restoreIntegrity() {
    if (this.integridad === MAX_INTEGRITY) return;
    this.integridad = MAX_INTEGRITY;
    EventBus.emit('integrity:changed', this.integridad);
    this.#touch();
  }

  grantAbility(ability: AbilityId) {
    if (this.habilidades.has(ability)) return false;
    this.habilidades.add(ability);
    EventBus.emit('ability:granted', ability);
    this.#touch();
    return true;
  }

  collectFragment(id: string) {
    if (!getFragment(id) || this.fragmentos.has(id)) return false;
    this.fragmentos.add(id);
    EventBus.emit('fragment:collected', id);
    this.#touch();
    return true;
  }

  solvePuzzle(zone: ZoneId) {
    if (this.flags.acertijosResueltos.includes(zone)) return false;
    this.flags.acertijosResueltos.push(zone);
    EventBus.emit('puzzle:solved', zone);
    this.#touch();
    return true;
  }

  dissolveNpc(npcId: NpcId) {
    if (this.flags.npcsDisueltos.includes(npcId)) return false;
    this.flags.npcsDisueltos.push(npcId);
    EventBus.emit('npc:dissolve', npcId);
    this.#touch();
    return true;
  }

  enterZone(zone: ZoneId) {
    this.zona = zone;
    if (zone === 'tower') this.flags.torreAlcanzada = true;
    // Reaplica el suelo de corrupción de la nueva zona.
    this.corrupcion = Math.max(this.#corrupcion, this.corruptionFloor);
    this.#touch();
  }

  /** Copia de solo lectura que se envía al servidor del agente. */
  snapshot(): GameStateSnapshot {
    return {
      zona: this.zona,
      habilidades: [...this.habilidades],
      fragmentos: [...this.fragmentos],
      corrupcion: Number(this.#corrupcion.toFixed(3)),
      flags: structuredClone(this.flags),
    };
  }

  serialize(): SerializedState {
    return {
      version: SAVE_VERSION,
      zona: this.zona,
      habilidades: [...this.habilidades],
      fragmentos: [...this.fragmentos],
      corrupcion: this.#corrupcion,
      flags: structuredClone(this.flags),
      integridad: this.integridad,
      tiempo: this.tiempo,
    };
  }

  load(data: SerializedState) {
    this.zona = data.zona;
    this.habilidades = new Set(data.habilidades);
    this.fragmentos = new Set(data.fragmentos);
    this.flags = { ...structuredClone(DEFAULT_FLAGS), ...structuredClone(data.flags) };
    this.#corrupcion = data.corrupcion;
    this.integridad = data.integridad ?? MAX_INTEGRITY;
    this.tiempo = data.tiempo;
    EventBus.emit('state:changed');
  }

  reset() {
    this.zona = 'z1';
    this.habilidades.clear();
    this.fragmentos.clear();
    this.flags = structuredClone(DEFAULT_FLAGS);
    this.#corrupcion = 0;
    this.integridad = MAX_INTEGRITY;
    this.tiempo = 0;
    EventBus.emit('state:changed');
  }

  #touch() {
    EventBus.emit('state:changed');
  }
}

export const GameState = new GameStateStore();

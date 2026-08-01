import type { AbilityId, NpcId, ZoneId } from '@shared/types';
import type { SurfaceStyle } from './art/PlatformPainter';

export interface Vec {
  x: number;
  y: number;
}

export interface Rect extends Vec {
  w: number;
  h: number;
}

export interface PlatformDef extends Rect {
  style?: SurfaceStyle;
  /** Plataforma móvil: se desplaza en bucle con un tween de ida y vuelta. */
  move?: { dx?: number; dy?: number; duration: number; delay?: number };
  /** Solo existe si el jugador tiene esta habilidad (plataformas holográficas). */
  requires?: AbilityId;
  /**
   * Declara que esta superficie está fuera del alcance de un doble salto y solo
   * se llega con esta habilidad. Las pruebas de geometría lo respetan y verifican
   * que la habilidad ya esté disponible al llegar a la zona.
   */
  reachedWith?: AbilityId;
  /** Se desmorona al pisarla. */
  crumbles?: boolean;
}

/** Superficie vertical agarrable con `wallClimb`. */
export interface WallDef extends Rect {
  style?: SurfaceStyle;
}

export interface HazardDef extends Rect {
  kind: 'spike' | 'water' | 'laser' | 'press';
  /** Para prensas y láseres: periodo de activación en ms. */
  cycle?: number;
  phase?: number;
}

export interface FragmentDef extends Vec {
  /** Id de `MEMORY_FRAGMENTS` en shared/lore.ts. */
  id: string;
}

export interface NpcDef extends Vec {
  npcId: NpcId;
  /** Si es true, el NPC bloquea el paso hasta que se hable con él. */
  gatekeeper?: boolean;
}

export interface EnemyDef extends Vec {
  kind: 'drone' | 'sentinel' | 'gang';
  /** Amplitud de patrulla en px. Los sentinelas con 0 se quedan quietos. */
  patrol?: number;
  speed?: number;
}

export interface DoorDef extends Vec {
  id: string;
  h: number;
  /** `hack` requiere la habilidad; `puzzle` requiere resolver el acertijo de la zona. */
  opensWith: 'hack' | 'puzzle';
}

export interface PickupDef extends Vec {
  ability: AbilityId;
}

/** Trigger que resuelve el acertijo de la zona al tocar todas sus placas. */
export interface PuzzlePlateDef extends Vec {
  /** Placas del mismo grupo deben activarse dentro de la ventana temporal. */
  group: string;
  /** ms que la placa permanece activa. */
  holdMs?: number;
}

export interface ZoneDefinition {
  id: ZoneId;
  /** Tamaño del mundo en px. La cámara se limita a esto. */
  width: number;
  height: number;
  spawn: Vec;
  /** Zona de salida; al tocarla se avanza a `to`. */
  exit: Rect & { to: ZoneId };
  /** Suelo continuo en la base del nivel; false para niveles con vacío mortal. */
  floor: boolean;
  rain: { intensity: number; inverted?: boolean };
  platforms: PlatformDef[];
  walls: WallDef[];
  hazards: HazardDef[];
  fragments: FragmentDef[];
  npcs: NpcDef[];
  enemies: EnemyDef[];
  doors: DoorDef[];
  pickups: PickupDef[];
  plates: PuzzlePlateDef[];
  /** Carteles ambientales: texto que cambia cuando sube la corrupción. */
  signs: Array<Vec & { text: string; corrupted?: string }>;
  /**
   * Pistas de tutorial. Aparecen al acercarse y se apagan al alejarse, así que
   * enseñan sin interrumpir. Se usan sobre todo en la zona 1.
   */
  tips: Array<Vec & { text: string; radius?: number }>;
}

/** Valores por defecto para no repetir listas vacías en cada zona. */
export function zone(partial: Partial<ZoneDefinition> & Pick<ZoneDefinition, 'id' | 'spawn' | 'exit'>): ZoneDefinition {
  return {
    width: 1920,
    height: 540,
    floor: true,
    rain: { intensity: 0.6 },
    platforms: [],
    walls: [],
    hazards: [],
    fragments: [],
    npcs: [],
    enemies: [],
    doors: [],
    pickups: [],
    plates: [],
    signs: [],
    tips: [],
    ...partial,
  };
}

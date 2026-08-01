import { PALETTE } from '@/core/constants';
import { ABILITY_NAMES } from '@shared/lore';
import type { AbilityId } from '@shared/types';

export interface AbilitySpec {
  id: AbilityId;
  nombre: string;
  /** Tecla que la activa, para el HUD y el aviso de desbloqueo. */
  tecla: string;
  color: number;
  /** Icono de una sola letra dibujado en el HUD. */
  glifo: string;
  descripcion: string;
}

/**
 * Metadatos de las siete habilidades. La lógica de movimiento vive en `Player`
 * porque está entrelazada con la máquina de estados; aquí solo queda lo que
 * necesitan el HUD y los avisos de desbloqueo.
 */
export const ABILITIES: Record<AbilityId, AbilitySpec> = {
  doubleJump: {
    id: 'doubleJump',
    nombre: ABILITY_NAMES.doubleJump,
    tecla: 'SPACE ×2',
    color: PALETTE.neonCyan,
    glifo: '↑',
    descripcion: 'Un segundo impulso en el aire. Nova ya no necesita el suelo.',
  },
  dash: {
    id: 'dash',
    nombre: ABILITY_NAMES.dash,
    tecla: 'SHIFT',
    color: PALETTE.neonPink,
    glifo: '»',
    descripcion: 'Un desplazamiento instantáneo que atraviesa los láseres.',
  },
  wallClimb: {
    id: 'wallClimb',
    nombre: ABILITY_NAMES.wallClimb,
    tecla: '↑ en pared',
    color: PALETTE.neonViolet,
    glifo: '⇈',
    descripcion: 'Las garras se agarran al metal mojado.',
  },
  hack: {
    id: 'hack',
    nombre: ABILITY_NAMES.hack,
    tecla: 'E',
    color: PALETTE.neonAmber,
    glifo: '⌘',
    descripcion: 'El collar puede hablar con las cerraduras.',
  },
  gravityFlip: {
    id: 'gravityFlip',
    nombre: ABILITY_NAMES.gravityFlip,
    tecla: 'Q',
    color: 0x9d7bff,
    glifo: '⇕',
    descripcion: 'Arriba y abajo son solo una convención del sistema.',
  },
  holoPlatform: {
    id: 'holoPlatform',
    nombre: ABILITY_NAMES.holoPlatform,
    tecla: 'F',
    color: 0x5ce1ff,
    glifo: '▤',
    descripcion: 'Suelo donde no hay suelo. Dura poco.',
  },
  droneControl: {
    id: 'droneControl',
    nombre: ABILITY_NAMES.droneControl,
    tecla: 'R',
    color: 0xff8bd0,
    glifo: '◈',
    descripcion: 'Los drones obedecen a quien recuerdan.',
  },
};

export const ABILITY_ORDER: AbilityId[] = [
  'doubleJump',
  'dash',
  'wallClimb',
  'hack',
  'gravityFlip',
  'holoPlatform',
  'droneControl',
];

import type { ZoneId } from '@shared/types';
import type { ZoneDefinition } from '../ZoneDefinition';
import { z1 } from './z1';
import { z2 } from './z2';
import { z3 } from './z3';
import { z4 } from './z4';
import { z5 } from './z5';
import { z6 } from './z6';
import { z7 } from './z7';
import { tower } from './tower';

/**
 * Registro de zonas. `GameScene` solo conoce este mapa, así que añadir contenido
 * nuevo no requiere tocar la lógica de juego.
 */
export const ZONE_DEFINITIONS: Record<ZoneId, ZoneDefinition> = {
  z1,
  z2,
  z3,
  z4,
  z5,
  z6,
  z7,
  tower,
};

export function getZone(id: ZoneId): ZoneDefinition {
  const def = ZONE_DEFINITIONS[id];
  if (!def) throw new Error(`Zona desconocida: ${id}`);
  return def;
}

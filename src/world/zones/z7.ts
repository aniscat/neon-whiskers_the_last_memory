import { zone } from '../ZoneDefinition';

/**
 * Zona 7 — Servidores gigantes. Última zona antes de la Torre. Se entrega el
 * control de drones. Zona con suelo continuo y sección vertical con pared
 * escalable para llegar al ascensor.
 */
export const z7 = zone({
  id: 'z7',
  width: 900,
  height: 500,
  spawn: { x: 40, y: 440 },
  exit: { x: 830, y: 128, w: 40, h: 72, to: 'tower' },
  floor: true,
  rain: { intensity: 0.45, inverted: true },

  platforms: [
    { x: 100, y: 450, w: 120, h: 10, style: 'metal' },
    { x: 280, y: 420, w: 100, h: 10, style: 'metal' },
    // Área del NPC y acertijo.
    { x: 440, y: 440, w: 180, h: 10, style: 'concrete' },
    // Post-puerta.
    { x: 670, y: 420, w: 80, h: 10, style: 'metal' },
    // Plataforma de salida.
    { x: 830, y: 200, w: 80, h: 10, style: 'concrete' },
  ],

  walls: [
    // Pared escalable que lleva al ascensor de la Torre.
    { x: 810, y: 200, w: 14, h: 280, style: 'wall' },
  ],

  hazards: [
    { x: 250, y: 478, w: 100, h: 10, kind: 'spike' },
  ],

  plates: [
    { x: 500, y: 432, group: 'drones', holdMs: 2200 },
    { x: 560, y: 432, group: 'drones', holdMs: 2200 },
  ],

  doors: [{ id: 'ascensor-torre', x: 640, y: 440, h: 64, opensWith: 'puzzle' }],

  fragments: [
    { id: 'm13', x: 460, y: 406 },
    { id: 'm14', x: 860, y: 166 },
  ],

  pickups: [{ ability: 'droneControl', x: 320, y: 386 }],

  npcs: [{ npcId: 'aceptacion', x: 520, y: 415 }],

  enemies: [{ kind: 'drone', x: 700, y: 380, patrol: 80 }],

  signs: [
    { x: 520, y: 380, text: 'RACK 7 — UNIDAD NOA', corrupted: 'RACK 7 — ERES TÚ' },
    { x: 860, y: 170, text: 'ASCENSOR — TORRE', corrupted: 'ASCENSOR — ÚLTIMA PARADA' },
  ],
});

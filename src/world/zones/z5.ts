import { zone } from '../ZoneDefinition';

/**
 * Zona 5 — Barrios de pandillas. Zona hostil y de doble altura: hay un camino por
 * el suelo y otro por el techo. La gravedad invertida se entrega al principio
 * porque el acertijo consiste en recorrer los tres generadores por arriba.
 */
export const z5 = zone({
  id: 'z5',
  width: 2600,
  height: 560,
  spawn: { x: 40, y: 480 },
  exit: { x: 2530, y: 460, w: 40, h: 64, to: 'z6' },
  rain: { intensity: 0.7 },

  platforms: [
    { x: 120, y: 470, w: 140, h: 10, style: 'concrete' },
    { x: 320, y: 430, w: 100, h: 10, style: 'hazard' },

    // Techo continuo: el camino "de arriba" cuando se invierte la gravedad.
    { x: 500, y: 60, w: 1700, h: 14, style: 'metal' },

    // Barricadas de chatarra a nivel de suelo.
    { x: 520, y: 460, w: 120, h: 10, style: 'hazard' },
    { x: 720, y: 420, w: 100, h: 10, style: 'concrete' },
    { x: 900, y: 470, w: 120, h: 10, style: 'hazard' },
    { x: 1120, y: 430, w: 100, h: 10, style: 'concrete' },
    { x: 1320, y: 470, w: 140, h: 10, style: 'hazard' },
    { x: 1560, y: 420, w: 120, h: 10, style: 'concrete' },
    { x: 1780, y: 460, w: 140, h: 10, style: 'hazard' },
    { x: 2020, y: 420, w: 120, h: 10, style: 'concrete' },
    { x: 2240, y: 460, w: 140, h: 10, style: 'concrete' },
    { x: 2460, y: 460, w: 140, h: 12, style: 'concrete' },
  ],

  walls: [
    { x: 470, y: 60, w: 14, h: 380, style: 'wall' },
    { x: 2210, y: 60, w: 14, h: 380, style: 'wall' },
  ],

  hazards: [
    { x: 660, y: 514, w: 200, h: 10, kind: 'spike' },
    { x: 1040, y: 514, w: 220, h: 10, kind: 'spike' },
    { x: 1480, y: 514, w: 240, h: 10, kind: 'spike' },
    { x: 1940, y: 514, w: 200, h: 10, kind: 'spike' },
    { x: 1200, y: 90, w: 6, h: 100, kind: 'laser', cycle: 1400, phase: 0 },
    { x: 1700, y: 90, w: 6, h: 100, kind: 'laser', cycle: 1400, phase: 700 },
  ],

  // Los tres generadores están pegados al techo: hay que ir por arriba.
  plates: [
    { x: 760, y: 80, group: 'generadores', holdMs: 5000 },
    { x: 1400, y: 80, group: 'generadores', holdMs: 5000 },
    { x: 2020, y: 80, group: 'generadores', holdMs: 5000 },
  ],

  doors: [{ id: 'paso-norte', x: 2380, y: 460, h: 64, opensWith: 'puzzle' }],

  fragments: [
    { id: 'm09', x: 1140, y: 400 },
    { id: 'm10', x: 1600, y: 100 },
  ],

  pickups: [{ ability: 'gravityFlip', x: 370, y: 400 }],

  npcs: [{ npcId: 'ira', x: 1600, y: 395 }],

  enemies: [
    { kind: 'gang', x: 800, y: 500, patrol: 120 },
    { kind: 'gang', x: 1300, y: 500, patrol: 140 },
    { kind: 'gang', x: 1900, y: 500, patrol: 130 },
    { kind: 'drone', x: 1500, y: 200, patrol: 200 },
  ],

  signs: [
    { x: 700, y: 380, text: 'TERRITORIO COLMILLO', corrupted: 'TERRITORIO HASTA EL MARTES' },
    { x: 1600, y: 140, text: 'GEN 1-3', corrupted: 'GEN 1-3 — SIN CARGA' },
    { x: 2300, y: 420, text: 'LÍMITE DE SECTOR', corrupted: 'NO HAY NADA DETRÁS' },
  ],
});

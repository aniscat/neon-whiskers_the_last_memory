import { zone } from '../ZoneDefinition';

/**
 * Zona 3 — Túneles inundados. Nivel vertical y estrecho: el agua negra cubre el
 * suelo y la única forma de progresar es por las paredes, así que la escalada se
 * entrega pronto y el resto de la zona la exige.
 */
export const z3 = zone({
  id: 'z3',
  width: 1600,
  height: 900,
  spawn: { x: 40, y: 200 },
  exit: { x: 1500, y: 86, w: 40, h: 64, to: 'z4' },
  rain: { intensity: 0.2 },

  platforms: [
    { x: 10, y: 230, w: 140, h: 10, style: 'concrete' },
    { x: 200, y: 270, w: 90, h: 10, style: 'metal' },
    { x: 340, y: 330, w: 90, h: 10, style: 'metal' },

    // Pozo de bombas: se baja hasta el agua para pisar las placas.
    { x: 480, y: 420, w: 110, h: 10, style: 'concrete' },
    { x: 480, y: 620, w: 340, h: 10, style: 'concrete' },
    { x: 900, y: 620, w: 200, h: 10, style: 'concrete' },

    // Chimenea vertical que solo se sube escalando.
    { x: 1120, y: 560, w: 60, h: 10, style: 'metal' },
    { x: 1120, y: 440, w: 60, h: 10, style: 'metal' },
    { x: 1120, y: 320, w: 60, h: 10, style: 'metal' },
    { x: 1240, y: 220, w: 90, h: 10, style: 'concrete' },
    { x: 1440, y: 150, w: 150, h: 12, style: 'concrete' },
  ],

  walls: [
    // Paredes de la chimenea, a ambos lados.
    { x: 1090, y: 200, w: 14, h: 420, style: 'wall' },
    { x: 1330, y: 150, w: 14, h: 470, style: 'wall' },
    { x: 440, y: 340, w: 14, h: 280, style: 'wall' },
  ],

  hazards: [
    // Agua negra en el fondo del túnel.
    { x: 0, y: 860, w: 1600, h: 40, kind: 'water' },
    { x: 620, y: 610, w: 8, h: 20, kind: 'laser', cycle: 2200, phase: 0 },
    { x: 760, y: 610, w: 8, h: 20, kind: 'laser', cycle: 2200, phase: 1100 },
  ],

  plates: [
    { x: 520, y: 612, group: 'bombas', holdMs: 3400 },
    { x: 660, y: 612, group: 'bombas', holdMs: 3400 },
    { x: 800, y: 612, group: 'bombas', holdMs: 3400 },
    { x: 950, y: 612, group: 'bombas', holdMs: 3400 },
  ],

  doors: [{ id: 'galeria-central', x: 1060, y: 540, h: 80, opensWith: 'puzzle' }],

  fragments: [
    { id: 'm05', x: 540, y: 580 },
    { id: 'm06', x: 1160, y: 400 },
  ],

  pickups: [{ ability: 'wallClimb', x: 400, y: 300 }],

  npcs: [{ npcId: 'miedo', x: 990, y: 595 }],

  enemies: [
    { kind: 'sentinel', x: 700, y: 600, patrol: 0 },
    { kind: 'drone', x: 1200, y: 480, patrol: 60 },
  ],

  signs: [
    { x: 700, y: 560, text: 'BOMBAS 1-4 — OPERATIVAS', corrupted: 'BOMBAS 1-4 — 400 AÑOS' },
    { x: 1240, y: 190, text: 'NIVEL -3', corrupted: 'NIVEL -3-3-3' },
  ],
});

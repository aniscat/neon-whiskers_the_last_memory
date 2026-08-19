import { zone } from '../ZoneDefinition';

/**
 * Zona 3 — Túneles inundados. Se entrega la escalada de paredes al principio.
 * Zona con suelo continuo pero con una sección vertical donde hay que escalar
 * la pared para llegar a la salida.
 */
export const z3 = zone({
  id: 'z3',
  width: 900,
  height: 500,
  spawn: { x: 40, y: 440 },
  exit: { x: 830, y: 86, w: 40, h: 64, to: 'z4' },
  floor: true,
  rain: { intensity: 0.2 },

  platforms: [
    { x: 100, y: 450, w: 120, h: 10, style: 'concrete' },
    // Pickup de escalada.
    { x: 280, y: 420, w: 100, h: 10, style: 'metal' },
    // Área del NPC y acertijo.
    { x: 440, y: 440, w: 180, h: 10, style: 'concrete' },
    // Base de la torre de escalada.
    { x: 670, y: 420, w: 80, h: 10, style: 'metal' },
    // Repisa intermedia (accesible con doble salto: 100 ≤ 121).
    { x: 670, y: 320, w: 60, h: 10, style: 'metal' },
    // Repisa alta (accesible con doble salto: 100 ≤ 121).
    { x: 670, y: 220, w: 60, h: 10, style: 'metal' },
    // Plataforma de salida.
    { x: 810, y: 150, w: 80, h: 10, style: 'concrete' },
  ],

  walls: [
    // Pared climbable que cubre toda la sección vertical.
    { x: 650, y: 150, w: 14, h: 280, style: 'wall' },
  ],

  hazards: [
    { x: 250, y: 478, w: 100, h: 10, kind: 'spike' },
  ],

  plates: [
    { x: 500, y: 432, group: 'bombas', holdMs: 2200 },
    { x: 560, y: 432, group: 'bombas', holdMs: 2200 },
  ],

  doors: [{ id: 'galeria-central', x: 640, y: 420, h: 64, opensWith: 'puzzle' }],

  fragments: [
    { id: 'm05', x: 560, y: 406 },
    { id: 'm06', x: 700, y: 186 },
  ],

  pickups: [{ ability: 'wallClimb', x: 320, y: 386 }],

  npcs: [{ npcId: 'miedo', x: 520, y: 415 }],

  enemies: [{ kind: 'drone', x: 700, y: 360, patrol: 60 }],

  signs: [
    { x: 520, y: 400, text: 'BOMBAS 1-4 — OPERATIVAS', corrupted: 'BOMBAS 1-4 — 400 AÑOS' },
    { x: 830, y: 120, text: 'NIVEL -3', corrupted: 'NIVEL -3-3-3' },
  ],
});

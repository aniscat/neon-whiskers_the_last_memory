import { zone } from '../ZoneDefinition';

/**
 * Zona 4 — Laboratorios. Se entrega el hackeo. Zona plana con suelo, una placa
 * para la puerta de acertijo y una puerta de hackeo tras recoger la habilidad.
 */
export const z4 = zone({
  id: 'z4',
  width: 900,
  height: 420,
  spawn: { x: 40, y: 370 },
  exit: { x: 840, y: 340, w: 40, h: 64, to: 'z5' },
  floor: true,
  rain: { intensity: 0.15 },

  platforms: [
    { x: 100, y: 366, w: 100, h: 10, style: 'concrete' },
    { x: 260, y: 340, w: 100, h: 10, style: 'concrete' },
    // Área del NPC y acertijo.
    { x: 420, y: 356, w: 180, h: 10, style: 'concrete' },
    // Post-puzzle.
    { x: 660, y: 356, w: 80, h: 10, style: 'metal' },
    // Post-hack.
    { x: 800, y: 356, w: 80, h: 10, style: 'concrete' },
  ],

  walls: [],

  hazards: [
    { x: 350, y: 398, w: 60, h: 10, kind: 'spike' },
  ],

  plates: [
    { x: 480, y: 348, group: 'clave', holdMs: 2000 },
    { x: 540, y: 348, group: 'clave', holdMs: 2000 },
  ],

  doors: [
    { id: 'archivo', x: 640, y: 356, h: 64, opensWith: 'puzzle' },
    { id: 'sala-limpia', x: 780, y: 356, h: 64, opensWith: 'hack' },
  ],

  fragments: [
    { id: 'm07', x: 310, y: 306 },
    { id: 'm08', x: 830, y: 322 },
  ],

  pickups: [{ ability: 'hack', x: 700, y: 322 }],

  npcs: [{ npcId: 'codicia', x: 500, y: 331 }],

  enemies: [{ kind: 'drone', x: 600, y: 310, patrol: 60 }],

  signs: [
    { x: 500, y: 316, text: 'PROYECTO MOTHER — ACTA 1', corrupted: 'PROYECTO MOTHER — Y MANTENERLA' },
    { x: 830, y: 316, text: 'SALA LIMPIA', corrupted: 'HABITACIÓN 402' },
  ],
});

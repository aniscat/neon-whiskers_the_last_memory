import { zone } from '../ZoneDefinition';

/**
 * Zona 6 — Jardines artificiales olvidados. Se entrega la plataforma holográfica.
 * Zona con suelo continuo y una sección vertical con pared escalable para
 * llegar a la salida en lo alto.
 */
export const z6 = zone({
  id: 'z6',
  width: 900,
  height: 500,
  spawn: { x: 40, y: 440 },
  exit: { x: 830, y: 116, w: 40, h: 64, to: 'z7' },
  floor: true,
  rain: { intensity: 0.1 },

  platforms: [
    { x: 100, y: 450, w: 120, h: 10, style: 'concrete' },
    { x: 280, y: 420, w: 100, h: 10, style: 'metal' },
    // Área del NPC y acertijo.
    { x: 440, y: 440, w: 180, h: 10, style: 'concrete' },
    // Post-puerta.
    { x: 680, y: 420, w: 80, h: 10, style: 'metal' },
    // Repisa alta (accesible desde la pared con wallClimb).
    { x: 800, y: 300, w: 80, h: 10, style: 'concrete' },
    // Plataforma de salida (accesible desde la pared).
    { x: 830, y: 180, w: 80, h: 10, style: 'concrete' },
  ],

  walls: [
    // Pared escalable que lleva de la base a la salida.
    { x: 780, y: 180, w: 12, h: 260, style: 'wall' },
  ],

  hazards: [
    { x: 300, y: 478, w: 80, h: 10, kind: 'spike' },
  ],

  plates: [
    { x: 500, y: 432, group: 'luz', holdMs: 2200 },
    { x: 560, y: 432, group: 'luz', holdMs: 2200 },
  ],

  doors: [{ id: 'cupula', x: 660, y: 420, h: 64, opensWith: 'puzzle' }],

  fragments: [
    { id: 'm11', x: 560, y: 406 },
    { id: 'm12', x: 840, y: 266 },
  ],

  pickups: [{ ability: 'holoPlatform', x: 320, y: 386 }],

  npcs: [{ npcId: 'esperanza', x: 520, y: 415 }],

  enemies: [{ kind: 'drone', x: 650, y: 380, patrol: 60 }],

  signs: [
    { x: 520, y: 400, text: 'INVERNADERO CENTRAL', corrupted: 'PARA CUANDO SALGA' },
    { x: 840, y: 270, text: 'CICLO DE CIELO: 96 F', corrupted: 'CICLO DE CIELO: 4 SEG' },
  ],
});

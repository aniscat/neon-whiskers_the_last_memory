import { zone } from '../ZoneDefinition';

/**
 * Zona 2 — Azoteas y pasarelas. Zona corta y tranquila con suelo seguro.
 * El dash se recoge al final, tras un acertijo de una sola placa.
 */
export const z2 = zone({
  id: 'z2',
  width: 800,
  height: 380,
  spawn: { x: 40, y: 330 },
  exit: { x: 730, y: 188, w: 44, h: 64, to: 'z3' },
  floor: true,
  rain: { intensity: 0.8 },

  platforms: [
    { x: 120, y: 338, w: 100, h: 10, style: 'metal' },
    { x: 280, y: 306, w: 120, h: 10, style: 'concrete' },
    // Área del NPC: amplia.
    { x: 460, y: 320, w: 140, h: 10, style: 'concrete' },
    { x: 650, y: 310, w: 80, h: 10, style: 'metal' },
    // Plataforma de salida con el pickup de dash.
    { x: 720, y: 252, w: 80, h: 10, style: 'concrete' },
  ],

  walls: [],

  hazards: [
    { x: 200, y: 358, w: 80, h: 10, kind: 'spike' },
    { x: 500, y: 358, w: 80, h: 10, kind: 'spike' },
  ],

  plates: [
    { x: 490, y: 312, group: 'senales', holdMs: 2000 },
    { x: 550, y: 312, group: 'senales', holdMs: 2000 },
  ],

  doors: [{ id: 'barrera-azotea', x: 630, y: 310, h: 64, opensWith: 'puzzle' }],

  fragments: [
    { id: 'm03', x: 340, y: 272 },
    { id: 'm04', x: 690, y: 276 },
  ],

  pickups: [{ ability: 'dash', x: 760, y: 218 }],

  npcs: [{ npcId: 'olvido', x: 520, y: 295 }],

  enemies: [{ kind: 'drone', x: 500, y: 270, patrol: 60 }],

  tips: [
    { x: 70, y: 330, text: 'Sube a las pasarelas', radius: 90 },
    { x: 520, y: 288, text: 'E  hablar con el gato', radius: 90 },
    { x: 520, y: 300, text: 'Pisa la señal para abrir la barrera', radius: 100 },
    { x: 760, y: 230, text: 'SHIFT: usa el dash', radius: 90 },
  ],

  signs: [
    { x: 340, y: 270, text: 'AZOTEA 3 — ACCESO RESTRINGIDO', corrupted: 'AZOTEA 3 — ¿QUIÉN LO RESTRINGIÓ?' },
    { x: 690, y: 268, text: 'SEÑALES DE DESTINO', corrupted: 'SEÑALES DE -----' },
  ],
});

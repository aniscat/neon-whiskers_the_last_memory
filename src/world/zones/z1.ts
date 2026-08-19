import { zone } from '../ZoneDefinition';

/**
 * Zona 1 — Fábricas abandonadas. Tutorial: enseña moverse, saltar, el doble
 * salto (que se recoge pronto), hablar con un gato y pisar una placa.
 *
 * Diseño fácil: suelo continuo, escalones ≤40 px, una sola placa, sin láseres.
 */
export const z1 = zone({
  id: 'z1',
  width: 900,
  height: 400,
  spawn: { x: 40, y: 350 },
  exit: { x: 830, y: 266, w: 36, h: 64, to: 'z2' },
  floor: true,
  rain: { intensity: 0.55 },

  platforms: [
    // Escalón 1: subida suave desde el suelo.
    { x: 120, y: 352, w: 100, h: 10, style: 'metal' },
    // Escalón 2: aquí está el módulo de doble salto.
    { x: 280, y: 324, w: 100, h: 10, style: 'concrete' },
    // Plataforma del NPC: amplia y segura.
    { x: 440, y: 340, w: 180, h: 10, style: 'concrete' },
    // Post-puerta.
    { x: 680, y: 340, w: 80, h: 10, style: 'metal' },
    // Plataforma de salida.
    { x: 810, y: 330, w: 80, h: 10, style: 'concrete' },
  ],

  walls: [],

  hazards: [
    // Pinchos en el suelo: incentivan subir a las plataformas.
    { x: 250, y: 388, w: 100, h: 10, kind: 'spike' },
  ],

  plates: [
    { x: 500, y: 332, group: 'prensas', holdMs: 2000 },
    { x: 560, y: 332, group: 'prensas', holdMs: 2000 },
  ],

  doors: [{ id: 'compuerta-carga', x: 650, y: 340, h: 64, opensWith: 'puzzle' }],

  fragments: [
    { id: 'm01', x: 340, y: 290 },
    { id: 'm02', x: 720, y: 306 },
  ],

  pickups: [{ ability: 'doubleJump', x: 310, y: 290 }],

  npcs: [{ npcId: 'duelo', x: 520, y: 315 }],

  enemies: [{ kind: 'drone', x: 700, y: 300, patrol: 60 }],

  tips: [
    { x: 60, y: 340, text: '← →  moverse', radius: 90 },
    { x: 160, y: 330, text: 'ESPACIO  saltar', radius: 90 },
    { x: 310, y: 290, text: 'Recoge el módulo de doble salto', radius: 70 },
    { x: 380, y: 310, text: 'En el aire, ESPACIO otra vez = doble salto', radius: 110 },
    { x: 520, y: 300, text: 'E  hablar con el gato', radius: 90 },
    { x: 530, y: 316, text: 'Pisa la placa para abrir la compuerta', radius: 100 },
  ],

  signs: [
    { x: 300, y: 290, text: 'SECTOR 7 — TURNO NOCHE', corrupted: 'SECTOR 7 — NADIE VOLVIÓ' },
    { x: 720, y: 300, text: 'SALIDA A RAÍLES', corrupted: 'SALIDA A NINGUNA PARTE' },
  ],
});

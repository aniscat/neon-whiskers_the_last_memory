import { zone } from '../ZoneDefinition';

/**
 * Zona 4 — Laboratorios. Aquí la historia gira: los fragmentos dejan de sonar
 * ajenos. Estructuralmente es un nivel de puertas: cuatro terminales, una clave y
 * la habilidad de hackeo como recompensa a mitad de zona.
 */
export const z4 = zone({
  id: 'z4',
  width: 2400,
  height: 560,
  spawn: { x: 40, y: 480 },
  exit: { x: 2330, y: 460, w: 40, h: 64, to: 'z5' },
  rain: { intensity: 0.15 },

  platforms: [
    { x: 140, y: 470, w: 120, h: 10, style: 'concrete' },
    { x: 320, y: 420, w: 100, h: 10, style: 'concrete' },
    { x: 480, y: 370, w: 100, h: 10, style: 'concrete' },

    // Pasillo de terminales.
    { x: 640, y: 460, w: 500, h: 12, style: 'concrete' },

    // Salas de cultivo, con plataformas que se desmoronan.
    { x: 1200, y: 420, w: 70, h: 10, style: 'metal', crumbles: true },
    { x: 1330, y: 380, w: 70, h: 10, style: 'metal', crumbles: true },
    { x: 1460, y: 340, w: 70, h: 10, style: 'metal' },

    { x: 1620, y: 400, w: 140, h: 10, style: 'concrete' },
    { x: 1840, y: 440, w: 140, h: 10, style: 'concrete' },
    { x: 2060, y: 400, w: 120, h: 10, style: 'concrete' },
    { x: 2260, y: 460, w: 140, h: 12, style: 'concrete' },
  ],

  walls: [
    { x: 600, y: 300, w: 12, h: 170, style: 'wall' },
    { x: 1790, y: 300, w: 12, h: 150, style: 'wall' },
  ],

  hazards: [
    { x: 1150, y: 514, w: 420, h: 10, kind: 'spike' },
    { x: 1700, y: 320, w: 6, h: 90, kind: 'laser', cycle: 1500, phase: 0 },
    { x: 1990, y: 360, w: 6, h: 90, kind: 'laser', cycle: 1500, phase: 750 },
  ],

  // Los cuatro terminales de la clave 2-9-0-4.
  plates: [
    { x: 700, y: 452, group: 'clave', holdMs: 4200 },
    { x: 820, y: 452, group: 'clave', holdMs: 4200 },
    { x: 940, y: 452, group: 'clave', holdMs: 4200 },
    { x: 1060, y: 452, group: 'clave', holdMs: 4200 },
  ],

  doors: [
    { id: 'archivo', x: 1160, y: 460, h: 64, opensWith: 'puzzle' },
    { id: 'sala-limpia', x: 2200, y: 460, h: 64, opensWith: 'hack' },
  ],

  fragments: [
    { id: 'm07', x: 520, y: 340 },
    { id: 'm08', x: 1490, y: 300 },
  ],

  pickups: [{ ability: 'hack', x: 1670, y: 365 }],

  npcs: [{ npcId: 'codicia', x: 900, y: 435 }],

  enemies: [
    { kind: 'sentinel', x: 1250, y: 500, patrol: 0 },
    { kind: 'drone', x: 1900, y: 350, patrol: 130 },
    { kind: 'gang', x: 2100, y: 500, patrol: 80 },
  ],

  signs: [
    { x: 880, y: 420, text: 'PROYECTO MOTHER — ACTA 1', corrupted: 'PROYECTO MOTHER — Y MANTENERLA' },
    { x: 1490, y: 260, text: 'INVENTARIO: 11 SUJETOS', corrupted: 'INVENTARIO: 11 AÑOS' },
    { x: 2130, y: 360, text: 'SALA LIMPIA', corrupted: 'HABITACIÓN 402' },
  ],
});

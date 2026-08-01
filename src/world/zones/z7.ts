import { zone } from '../ZoneDefinition';

/**
 * Zona 7 — Servidores gigantes. Última zona antes de la Torre. Aquí la lluvia ya
 * cae hacia arriba de serie y los dos fragmentos dicen la verdad casi a la cara.
 * Exige combinar todo lo aprendido: escalar, invertir gravedad y crear suelo.
 */
export const z7 = zone({
  id: 'z7',
  width: 2800,
  height: 720,
  spawn: { x: 40, y: 620 },
  exit: { x: 2720, y: 128, w: 40, h: 72, to: 'tower' },
  rain: { intensity: 0.45, inverted: true },

  platforms: [
    { x: 10, y: 650, w: 200, h: 10, style: 'metal' },

    // Pasillo de racks: columnas heladas con huecos estrechos.
    { x: 280, y: 600, w: 80, h: 10, style: 'metal' },
    { x: 430, y: 550, w: 80, h: 10, style: 'metal' },
    { x: 580, y: 500, w: 80, h: 10, style: 'metal' },
    { x: 730, y: 450, w: 120, h: 10, style: 'concrete' },

    // Tramo de gravedad: se alterna suelo y techo.
    { x: 920, y: 200, w: 700, h: 14, style: 'metal', reachedWith: 'gravityFlip' },
    { x: 940, y: 500, w: 100, h: 10, style: 'metal' },
    { x: 1140, y: 460, w: 100, h: 10, style: 'metal' },
    { x: 1340, y: 500, w: 100, h: 10, style: 'metal' },
    { x: 1540, y: 440, w: 120, h: 10, style: 'concrete' },

    // Sala de drones dormidos: aquí está el acertijo final.
    { x: 1740, y: 480, w: 420, h: 12, style: 'concrete' },

    // Ascenso al ascensor de la Torre.
    { x: 2240, y: 420, w: 90, h: 10, style: 'metal', move: { dy: -140, duration: 3400 } },
    { x: 2400, y: 320, w: 90, h: 10, style: 'concrete' },
    { x: 2680, y: 200, w: 120, h: 12, style: 'concrete' },
  ],

  walls: [
    { x: 690, y: 300, w: 14, h: 260, style: 'wall' },
    { x: 2370, y: 200, w: 14, h: 240, style: 'wall' },
    { x: 2620, y: 200, w: 14, h: 220, style: 'wall' },
  ],

  hazards: [
    { x: 220, y: 694, w: 640, h: 26, kind: 'water' },
    { x: 1080, y: 230, w: 6, h: 120, kind: 'laser', cycle: 1300, phase: 0 },
    { x: 1280, y: 230, w: 6, h: 120, kind: 'laser', cycle: 1300, phase: 430 },
    { x: 1480, y: 230, w: 6, h: 120, kind: 'laser', cycle: 1300, phase: 860 },
    { x: 1700, y: 694, w: 500, h: 26, kind: 'spike' },
  ],

  // Cuatro drones a los que hay que devolverles un recuerdo.
  plates: [
    { x: 1800, y: 472, group: 'drones', holdMs: 4600 },
    { x: 1930, y: 472, group: 'drones', holdMs: 4600 },
    { x: 2060, y: 472, group: 'drones', holdMs: 4600 },
  ],

  doors: [{ id: 'ascensor-torre', x: 2200, y: 480, h: 72, opensWith: 'puzzle' }],

  fragments: [
    { id: 'm13', x: 790, y: 410 },
    { id: 'm14', x: 1600, y: 400 },
  ],

  pickups: [{ ability: 'droneControl', x: 2445, y: 280 }],

  npcs: [{ npcId: 'aceptacion', x: 1930, y: 455 }],

  enemies: [
    { kind: 'drone', x: 1200, y: 350, patrol: 200 },
    { kind: 'drone', x: 1900, y: 300, patrol: 160 },
    { kind: 'sentinel', x: 1750, y: 460, patrol: 0 },
  ],

  signs: [
    { x: 790, y: 370, text: 'RACK 7 — UNIDAD NOA', corrupted: 'RACK 7 — ERES TÚ' },
    { x: 1600, y: 360, text: 'ARCHIVO: 94% FELINO', corrupted: 'ARCHIVO: 94% NOA' },
    { x: 2450, y: 280, text: 'ASCENSOR — TORRE', corrupted: 'ASCENSOR — ÚLTIMA PARADA' },
  ],
});

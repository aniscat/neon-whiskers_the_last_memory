import { zone } from '../ZoneDefinition';

/**
 * Zona 2 — Trenes suspendidos. Sin suelo: caerse mata. Todo el nivel son vagones
 * colgando y plataformas móviles, y el dash que se obtiene al final es lo único
 * que permite cruzar el último vano.
 */
export const z2 = zone({
  id: 'z2',
  width: 2600,
  height: 620,
  spawn: { x: 40, y: 420 },
  exit: { x: 2520, y: 236, w: 40, h: 64, to: 'z3' },
  floor: false,
  rain: { intensity: 0.85 },

  platforms: [
    { x: 10, y: 450, w: 120, h: 10, style: 'metal' },

    // Convoy 1: tres vagones que suben y bajan a distinto ritmo.
    { x: 190, y: 430, w: 90, h: 10, style: 'metal', move: { dy: -70, duration: 2400 } },
    { x: 340, y: 400, w: 90, h: 10, style: 'metal', move: { dy: 80, duration: 2800, delay: 400 } },
    { x: 490, y: 440, w: 90, h: 10, style: 'metal', move: { dy: -90, duration: 2200, delay: 800 } },

    // Andén intermedio con los paneles de destino.
    { x: 650, y: 400, w: 260, h: 12, style: 'concrete' },

    // Convoy 2: desplazamiento horizontal largo.
    { x: 980, y: 380, w: 80, h: 10, style: 'metal', move: { dx: 240, duration: 3600 } },
    { x: 1320, y: 340, w: 80, h: 10, style: 'metal', move: { dx: -200, duration: 3000 } },

    // Techo de vagón donde espera NADIE.
    { x: 1500, y: 320, w: 200, h: 12, style: 'metal' },

    // Tramo de raíl con láseres de seguridad.
    { x: 1760, y: 340, w: 70, h: 10, style: 'metal' },
    { x: 1900, y: 340, w: 70, h: 10, style: 'metal' },
    { x: 2040, y: 340, w: 70, h: 10, style: 'metal' },

    { x: 2180, y: 320, w: 90, h: 10, style: 'concrete' },
    // Vano final: solo se cruza con dash.
    { x: 2470, y: 300, w: 130, h: 12, style: 'concrete' },
  ],

  walls: [
    { x: 920, y: 300, w: 12, h: 120, style: 'wall' },
    { x: 1710, y: 220, w: 12, h: 120, style: 'wall' },
  ],

  hazards: [
    { x: 1830, y: 250, w: 6, h: 90, kind: 'laser', cycle: 1800, phase: 0 },
    { x: 1970, y: 250, w: 6, h: 90, kind: 'laser', cycle: 1800, phase: 600 },
    { x: 2110, y: 250, w: 6, h: 90, kind: 'laser', cycle: 1800, phase: 1200 },
  ],

  plates: [
    { x: 690, y: 392, group: 'destinos', holdMs: 3000 },
    { x: 780, y: 392, group: 'destinos', holdMs: 3000 },
    { x: 870, y: 392, group: 'destinos', holdMs: 3000 },
  ],

  doors: [{ id: 'freno-convoy', x: 940, y: 320, h: 90, opensWith: 'puzzle' }],

  fragments: [
    { id: 'm03', x: 780, y: 360 },
    { id: 'm04', x: 1600, y: 280 },
  ],

  pickups: [{ ability: 'dash', x: 2225, y: 285 }],

  npcs: [{ npcId: 'olvido', x: 1580, y: 295 }],

  enemies: [
    { kind: 'drone', x: 1100, y: 300, patrol: 150 },
    { kind: 'drone', x: 1900, y: 250, patrol: 110 },
  ],

  signs: [
    { x: 780, y: 360, text: 'ANDÉN 4 — 18:12', corrupted: 'ANDÉN 4 — 18:12 — 18:12' },
    { x: 1600, y: 260, text: 'DESTINO: TORRE', corrupted: 'DESTINO: ---------' },
  ],
});

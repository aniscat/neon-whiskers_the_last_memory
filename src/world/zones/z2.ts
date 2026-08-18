import { zone } from '../ZoneDefinition';

/**
 * Zona 2 — Trenes suspendidos. Sin suelo: caerse devuelve a Nova al último vagón
 * firme. Todo el nivel son vagones colgando y plataformas móviles, y el dash que
 * se obtiene al final es lo que abre la zona 3.
 *
 * La apertura es deliberadamente estática y suave: antes el primer salto era a una
 * plataforma que oscilaba 70 px, así que según el momento pedía un doble salto
 * perfecto y parecía que el salto no funcionaba. Las móviles llegan después, y
 * ninguna se aleja más de lo que alcanza un salto simple desde su vecina.
 *
 * Hay plataformas estáticas repartidas a propósito: son los únicos puntos de
 * retorno válidos (`buildSafeSpots` descarta las móviles).
 */
export const z2 = zone({
  id: 'z2',
  width: 2600,
  height: 620,
  spawn: { x: 40, y: 420 },
  exit: { x: 2450, y: 236, w: 40, h: 64, to: 'z3' },
  floor: false,
  rain: { intensity: 0.85 },

  platforms: [
    // Andén de salida y primer salto: ambos estáticos, subida de 30 px.
    { x: 10, y: 450, w: 130, h: 10, style: 'metal' },
    { x: 180, y: 420, w: 100, h: 10, style: 'metal' },

    // Primera móvil, con un recorrido corto: la subida nunca pasa de 50 px.
    { x: 330, y: 430, w: 90, h: 10, style: 'metal', move: { dy: -60, duration: 2600 } },
    // Descanso estático tras la móvil.
    { x: 480, y: 400, w: 100, h: 10, style: 'metal' },

    // Andén intermedio con los paneles de destino (acertijo de la zona).
    { x: 650, y: 400, w: 260, h: 12, style: 'concrete' },

    // Convoy largo en horizontal, con un vagón firme al final del recorrido.
    { x: 980, y: 380, w: 90, h: 10, style: 'metal', move: { dx: 200, duration: 3400 } },
    { x: 1260, y: 350, w: 100, h: 10, style: 'concrete' },
    { x: 1420, y: 340, w: 90, h: 10, style: 'metal', move: { dx: -160, duration: 3000 } },

    // Techo de vagón donde espera NADIE.
    { x: 1500, y: 320, w: 200, h: 12, style: 'metal' },

    // Tramo de raíl con los láseres de seguridad: se cruzan con dash.
    { x: 1760, y: 340, w: 80, h: 10, style: 'metal' },
    { x: 1900, y: 340, w: 80, h: 10, style: 'metal' },
    { x: 2040, y: 340, w: 80, h: 10, style: 'metal' },

    { x: 2180, y: 320, w: 100, h: 10, style: 'concrete' },
    // Vano final de 120 px: fuera del alcance de un salto simple (95 px).
    { x: 2400, y: 300, w: 130, h: 12, style: 'concrete' },
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
    { id: 'm03', x: 800, y: 350 },
    { id: 'm04', x: 1600, y: 282 },
  ],

  pickups: [{ ability: 'dash', x: 2230, y: 286 }],

  npcs: [{ npcId: 'olvido', x: 1560, y: 295 }],

  enemies: [
    { kind: 'drone', x: 1100, y: 300, patrol: 150 },
    { kind: 'drone', x: 1900, y: 240, patrol: 110 },
  ],

  tips: [
    { x: 70, y: 420, text: 'Aquí no hay suelo. Si caes, vuelves al último vagón.', radius: 120 },
    { x: 330, y: 390, text: 'Espera a que el vagón baje antes de saltar', radius: 110 },
    { x: 780, y: 370, text: 'Pisa los tres paneles de destino', radius: 140 },
    { x: 1560, y: 270, text: 'E  hablar con el gato', radius: 90 },
    { x: 1900, y: 300, text: 'SHIFT: el dash atraviesa los láseres', radius: 130 },
    { x: 2280, y: 280, text: 'Doble salto para cruzar', radius: 110 },
  ],

  signs: [
    { x: 780, y: 330, text: 'ANDÉN 4 — 18:12', corrupted: 'ANDÉN 4 — 18:12 — 18:12' },
    { x: 1600, y: 250, text: 'DESTINO: TORRE', corrupted: 'DESTINO: ---------' },
  ],
});

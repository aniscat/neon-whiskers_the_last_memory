import { zone } from '../ZoneDefinition';

/**
 * Zona 1 — Fábricas abandonadas. Hace de tutorial: enseña moverse, saltar, el
 * doble salto (que se recoge en los primeros metros), hablar con un gato, pisar
 * placas y usar una salida.
 *
 * Todos los escalones están dentro de los 60 px que alcanza un salto, y los
 * huecos dentro de los 95 px de un salto simple, salvo el último tramo, que
 * exige doble salto a propósito.
 */
export const z1 = zone({
  id: 'z1',
  width: 2400,
  height: 540,
  spawn: { x: 40, y: 480 },
  // La salida está en lo alto de la torre final: no se puede llegar por el suelo.
  exit: { x: 2320, y: 266, w: 36, h: 64, to: 'z2' },
  rain: { intensity: 0.55 },

  platforms: [
    // Tramo 1: escalones de 40-52 px entre brazos robóticos parados.
    { x: 150, y: 472, w: 80, h: 10, style: 'metal' },
    { x: 270, y: 430, w: 80, h: 10, style: 'metal' },
    { x: 400, y: 390, w: 90, h: 10, style: 'concrete' },
    { x: 540, y: 432, w: 70, h: 10, style: 'metal' },

    // Tramo 2: cinta transportadora móvil por encima de los pinchos.
    { x: 660, y: 400, w: 90, h: 8, style: 'metal', move: { dx: 200, duration: 3200 } },
    { x: 940, y: 400, w: 80, h: 10, style: 'concrete' },

    // Tramo 3: sala de las prensas, con las tres placas de presión.
    { x: 1060, y: 460, w: 130, h: 10, style: 'concrete' },
    { x: 1240, y: 460, w: 130, h: 10, style: 'concrete' },
    { x: 1420, y: 460, w: 130, h: 10, style: 'concrete' },

    // Tramo 4: torre de salida tras la compuerta. Escalones de 46-50 px.
    { x: 1700, y: 474, w: 80, h: 10, style: 'metal' },
    { x: 1830, y: 426, w: 80, h: 10, style: 'metal' },
    { x: 1960, y: 378, w: 80, h: 10, style: 'metal' },
    { x: 2090, y: 330, w: 80, h: 10, style: 'concrete' },
    // Hueco de 120 px: fuera del alcance de un salto simple (95 px).
    { x: 2290, y: 330, w: 110, h: 10, style: 'concrete' },
  ],

  walls: [{ x: 490, y: 300, w: 12, h: 92, style: 'wall' }],

  hazards: [
    // Las tres prensas hidráulicas, desfasadas entre sí.
    { x: 1090, y: 300, w: 60, h: 120, kind: 'press', cycle: 2600, phase: 0 },
    { x: 1270, y: 300, w: 60, h: 120, kind: 'press', cycle: 2600, phase: 900 },
    { x: 1450, y: 300, w: 60, h: 120, kind: 'press', cycle: 2600, phase: 1800 },
    { x: 700, y: 514, w: 230, h: 10, kind: 'spike' },
    // Chatarra cortante que obliga a subir por la torre en vez de andar hasta la salida.
    { x: 1690, y: 514, w: 700, h: 10, kind: 'spike' },
  ],

  plates: [
    { x: 1120, y: 452, group: 'prensas', holdMs: 2600 },
    { x: 1300, y: 452, group: 'prensas', holdMs: 2600 },
    { x: 1480, y: 452, group: 'prensas', holdMs: 2600 },
  ],

  doors: [{ id: 'compuerta-carga', x: 1620, y: 460, h: 64, opensWith: 'puzzle' }],

  fragments: [
    { id: 'm01', x: 430, y: 356 },
    { id: 'm02', x: 1995, y: 344 },
  ],

  // El doble salto se encuentra al principio: es parte del tutorial.
  pickups: [{ ability: 'doubleJump', x: 305, y: 396 }],

  npcs: [{ npcId: 'duelo', x: 985, y: 375 }],

  enemies: [
    { kind: 'gang', x: 830, y: 500, patrol: 80 },
    { kind: 'drone', x: 1780, y: 380, patrol: 110 },
  ],

  tips: [
    { x: 60, y: 450, text: '← →  moverse', radius: 90 },
    { x: 160, y: 440, text: 'ESPACIO  saltar', radius: 90 },
    { x: 305, y: 366, text: 'Recoge el módulo', radius: 70 },
    { x: 430, y: 330, text: 'En el aire, ESPACIO otra vez = doble salto', radius: 110 },
    { x: 660, y: 366, text: 'Espera la cinta. No pises los pinchos.', radius: 110 },
    { x: 960, y: 340, text: 'E  hablar con el gato', radius: 90 },
    { x: 1270, y: 420, text: 'Pisa las tres placas antes de que se apaguen', radius: 150 },
    { x: 1620, y: 420, text: 'La compuerta se abre al resolver el mecanismo', radius: 90 },
    { x: 2140, y: 300, text: 'Doble salto para cruzar', radius: 100 },
  ],

  signs: [
    { x: 300, y: 348, text: 'SECTOR 7 — TURNO NOCHE', corrupted: 'SECTOR 7 — NADIE VOLVIÓ' },
    { x: 1270, y: 250, text: 'PRENSAS 1-3', corrupted: 'PRENSAS 1-3-1-3-1-3' },
    { x: 2100, y: 274, text: 'SALIDA A RAÍLES', corrupted: 'SALIDA A NINGUNA PARTE' },
  ],
});

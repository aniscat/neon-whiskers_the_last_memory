import { zone } from '../ZoneDefinition';

/**
 * Zona 6 — Jardines artificiales olvidados. El respiro antes del final: apenas
 * hay enemigos y el reto es de navegación pura. Varias plataformas están marcadas
 * con `requires: holoPlatform`, así que solo aparecen una vez desbloqueada.
 */
export const z6 = zone({
  id: 'z6',
  width: 2400,
  height: 700,
  spawn: { x: 40, y: 600 },
  exit: { x: 2320, y: 116, w: 40, h: 64, to: 'z7' },
  rain: { intensity: 0.1 },

  platforms: [
    { x: 10, y: 620, w: 180, h: 10, style: 'concrete' },
    { x: 240, y: 570, w: 110, h: 10, style: 'holo' },
    { x: 400, y: 520, w: 110, h: 10, style: 'holo' },

    // Copas de los árboles de fibra óptica.
    { x: 580, y: 470, w: 90, h: 10, style: 'holo' },
    { x: 740, y: 420, w: 90, h: 10, style: 'holo', move: { dy: -60, duration: 2600 } },
    { x: 900, y: 380, w: 110, h: 10, style: 'concrete' },

    // Sala de los proyectores: aquí está el acertijo de la luz.
    { x: 1060, y: 440, w: 420, h: 12, style: 'concrete' },

    // Ascenso final hacia la cúpula.
    { x: 1560, y: 400, w: 90, h: 10, style: 'holo' },
    { x: 1720, y: 340, w: 90, h: 10, style: 'holo', move: { dx: 120, duration: 3000 } },
    { x: 2000, y: 290, w: 90, h: 10, style: 'concrete' },
    // Vano final infranqueable a propósito: hay que crear el suelo con [F].
    { x: 2280, y: 180, w: 120, h: 12, style: 'concrete', reachedWith: 'holoPlatform' },
  ],

  walls: [
    { x: 540, y: 380, w: 12, h: 240, style: 'wall' },
    { x: 1960, y: 180, w: 12, h: 180, style: 'wall' },
  ],

  hazards: [
    { x: 200, y: 674, w: 900, h: 26, kind: 'water' },
    { x: 1500, y: 300, w: 6, h: 100, kind: 'laser', cycle: 2000, phase: 0 },
  ],

  // Tres proyectores de color; hay que tenerlos encendidos a la vez.
  plates: [
    { x: 1120, y: 432, group: 'luz', holdMs: 3600 },
    { x: 1270, y: 432, group: 'luz', holdMs: 3600 },
    { x: 1420, y: 432, group: 'luz', holdMs: 3600 },
  ],

  doors: [{ id: 'cupula', x: 1520, y: 400, h: 64, opensWith: 'puzzle' }],

  fragments: [
    { id: 'm11', x: 930, y: 340 },
    { id: 'm12', x: 2030, y: 250 },
  ],

  pickups: [{ ability: 'holoPlatform', x: 2040, y: 250 }],

  npcs: [{ npcId: 'esperanza', x: 1270, y: 415 }],

  enemies: [{ kind: 'drone', x: 800, y: 300, patrol: 180 }],

  signs: [
    { x: 700, y: 380, text: 'INVERNADERO CENTRAL', corrupted: 'PARA CUANDO SALGA' },
    { x: 1270, y: 380, text: 'CICLO DE CIELO: 96 F', corrupted: 'CICLO DE CIELO: 4 SEG' },
  ],
});

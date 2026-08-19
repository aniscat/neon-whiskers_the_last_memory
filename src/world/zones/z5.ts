import { zone } from '../ZoneDefinition';

/**
 * Zona 5 — Barrios de pandillas. Se entrega la gravedad invertida. Zona con
 * suelo continuo. La plataforma del techo es accesible solo con gravityFlip
 * y contiene un fragmento como recompensa de exploración.
 */
export const z5 = zone({
  id: 'z5',
  width: 900,
  height: 420,
  spawn: { x: 40, y: 370 },
  exit: { x: 830, y: 340, w: 40, h: 64, to: 'z6' },
  floor: true,
  rain: { intensity: 0.7 },

  platforms: [
    { x: 100, y: 370, w: 120, h: 10, style: 'concrete' },
    { x: 280, y: 350, w: 120, h: 10, style: 'metal' },
    // Área del NPC y acertijo.
    { x: 460, y: 370, w: 180, h: 10, style: 'concrete' },
    // Post-puerta.
    { x: 700, y: 370, w: 200, h: 10, style: 'concrete' },
    // Techo: solo accesible con gravedad invertida (exploración).
    { x: 400, y: 60, w: 200, h: 14, style: 'metal', reachedWith: 'gravityFlip' },
  ],

  walls: [],

  hazards: [
    { x: 300, y: 398, w: 80, h: 10, kind: 'spike' },
  ],

  plates: [
    { x: 510, y: 362, group: 'generadores', holdMs: 2200 },
    { x: 570, y: 362, group: 'generadores', holdMs: 2200 },
  ],

  doors: [{ id: 'paso-norte', x: 680, y: 370, h: 64, opensWith: 'puzzle' }],

  fragments: [
    { id: 'm09', x: 320, y: 316 },
    { id: 'm10', x: 490, y: 90 },
  ],

  pickups: [{ ability: 'gravityFlip', x: 140, y: 336 }],

  npcs: [{ npcId: 'ira', x: 540, y: 345 }],

  enemies: [{ kind: 'gang', x: 750, y: 360, patrol: 60 }],

  signs: [
    { x: 540, y: 330, text: 'TERRITORIO COLMILLO', corrupted: 'TERRITORIO HASTA EL MARTES' },
    { x: 830, y: 330, text: 'LÍMITE DE SECTOR', corrupted: 'NO HAY NADA DETRÁS' },
  ],
});

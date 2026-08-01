import { zone } from '../ZoneDefinition';

/**
 * La Torre de la Memoria. La pelea contra el núcleo la gestiona `TowerBossScene`,
 * pero la arena se define aquí para reutilizar `LevelBuilder`: una sala cerrada,
 * sin lluvia, sin enemigos y sin salida hasta que MOTHER termina de hablar.
 */
export const tower = zone({
  id: 'tower',
  width: 480,
  height: 400,
  spawn: { x: 60, y: 320 },
  // La "salida" solo se usa como marcador; la escena del jefe la ignora.
  exit: { x: 440, y: 320, w: 30, h: 48, to: 'tower' },
  rain: { intensity: 0 },

  platforms: [
    { x: 60, y: 300, w: 90, h: 10, style: 'metal' },
    { x: 200, y: 260, w: 80, h: 10, style: 'metal' },
    { x: 340, y: 300, w: 90, h: 10, style: 'metal' },
    { x: 200, y: 180, w: 80, h: 10, style: 'holo' },
  ],

  walls: [
    { x: 0, y: 100, w: 14, h: 284, style: 'wall' },
    { x: 466, y: 100, w: 14, h: 284, style: 'wall' },
  ],

  signs: [{ x: 240, y: 140, text: 'NÚCLEO PRINCIPAL', corrupted: 'HOLA, NOA' }],
});

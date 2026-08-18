/**
 * Resolución del mundo de juego (16:9). Todas las coordenadas de escenas, HUD y
 * niveles están en estas unidades.
 */
export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 270;

/**
 * El canvas real es RENDER_SCALE veces más grande y cada cámara usa ese zoom, así
 * que las coordenadas de arriba no cambian pero hay 4x más píxeles donde dibujar.
 *
 * Esto es lo que hace legible el texto: en un canvas de 480x270, una fuente de
 * 6px tiene glifos de 5 píxeles de alto y al ampliarla queda ilegible. Con el
 * canvas a 960x540, `ui/text.ts` puede renderizar la fuente al doble de tamaño y
 * dibujarla a mitad de escala, quedando 1:1 con los píxeles del dispositivo.
 */
export const RENDER_SCALE = 2;
export const CANVAS_WIDTH = GAME_WIDTH * RENDER_SCALE;
export const CANVAS_HEIGHT = GAME_HEIGHT * RENDER_SCALE;

/** Los sprites de gato del pack son tiras de una fila con frames de 32x32. */
export const CAT_FRAME = 32;

export const PALETTE = {
  night: 0x05060d,
  deepBlue: 0x0b1030,
  neonPink: 0xff2f6d,
  neonCyan: 0x3fe0d0,
  neonViolet: 0x8b5cff,
  neonAmber: 0xffb347,
  rain: 0x6f8bd0,
  bone: 0xd7e3ff,
  platform: 0x141a33,
  platformEdge: 0x2b3a6b,
} as const;

/** Claves de escena, centralizadas para evitar strings sueltos. */
export const SCENES = {
  boot: 'boot',
  preload: 'preload',
  menu: 'menu',
  howToPlay: 'how-to-play',
  intro: 'intro',
  game: 'game',
  hud: 'hud',
  dialogue: 'dialogue',
  fragment: 'fragment',
  boss: 'boss',
  revelation: 'revelation',
  ending: 'ending',
  credits: 'credits',
  debugSheets: 'debug-sheets',
} as const;

/** Flags de depuración vía query string: `?debug=sheets,agent,physics`. */
export const DEBUG = new Set(
  new URLSearchParams(location.search).get('debug')?.split(',').map((s) => s.trim()) ?? [],
);

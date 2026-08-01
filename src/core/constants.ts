/** Resolución virtual de pixel art (16:9). Se escala a la ventana con FIT. */
export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 270;

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

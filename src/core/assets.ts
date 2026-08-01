import { CAT_VARIANTS, type CatVariant } from '@shared/npcs';
import { CAT_FRAME } from './constants';

export interface SheetSpec {
  key: string;
  url: string;
  frameWidth: number;
  frameHeight: number;
  /** Ancho total esperado del PNG; se valida en el arranque para detectar packs distintos. */
  expectedWidth: number;
}

/**
 * Medidas reales de los packs `AllCatsDemo` y `CatMaterialsDEMO`:
 * los gatos son tiras de 32x32 (idle 7 frames, jump 13; el gato Xmas trae 14
 * frames de idle), las pelotas 24x16 y el ratón 39x32.
 */
export const CAT_SHEETS: SheetSpec[] = CAT_VARIANTS.flatMap((variant: CatVariant) => [
  {
    key: `cat:${variant}:idle`,
    url: `assets/cats/${variant}/idle.png`,
    frameWidth: CAT_FRAME,
    frameHeight: CAT_FRAME,
    expectedWidth: variant === 'xmas' ? 448 : 224,
  },
  {
    key: `cat:${variant}:jump`,
    url: `assets/cats/${variant}/jump.png`,
    frameWidth: CAT_FRAME,
    frameHeight: CAT_FRAME,
    expectedWidth: 416,
  },
]);

export const PROP_SHEETS: SheetSpec[] = [
  {
    key: 'prop:mouse',
    url: 'assets/props/mouse.png',
    frameWidth: 39,
    frameHeight: 32,
    expectedWidth: 158,
  },
  ...(['blue', 'orange', 'pink'] as const).map((color) => ({
    key: `prop:ball-${color}`,
    url: `assets/props/ball-${color}.png`,
    frameWidth: 24,
    frameHeight: 16,
    expectedWidth: 120,
  })),
];

export const IMAGES = [
  { key: 'prop:cat-bed', url: 'assets/props/cat-bed.png' },
  { key: 'prop:cat-bowls', url: 'assets/props/cat-bowls.png' },
] as const;

export const ALL_SHEETS = [...CAT_SHEETS, ...PROP_SHEETS];

/** Nombres de animación, compartidos por el jugador y los NPC. */
export const ANIM = {
  idle: 'idle',
  run: 'run',
  jumpRise: 'jump-rise',
  jumpFall: 'jump-fall',
  doubleJump: 'double-jump',
  dash: 'dash',
  climb: 'climb',
  hurt: 'hurt',
} as const;

export const animKey = (variant: string, name: string) => `${variant}:${name}`;

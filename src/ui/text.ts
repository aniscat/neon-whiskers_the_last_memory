import Phaser from 'phaser';

/** Único sitio donde se define la tipografía, para que todo el juego sea coherente. */
export const FONT = 'monospace';

export type TextSize = 'micro' | 'small' | 'body' | 'title' | 'huge';

const SIZES: Record<TextSize, string> = {
  micro: '6px',
  small: '8px',
  body: '9px',
  title: '16px',
  huge: '22px',
};

export function label(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  size: TextSize = 'body',
  color = '#d7e3ff',
): Phaser.GameObjects.Text {
  return scene.add.text(x, y, text, {
    fontFamily: FONT,
    fontSize: SIZES[size],
    color,
  });
}

/** Texto con resplandor de neón, para títulos y avisos importantes. */
export function neonLabel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  size: TextSize,
  color: string,
): Phaser.GameObjects.Text {
  return label(scene, x, y, text, size, color).setShadow(0, 0, color, 6, true, true);
}

export const hex = (color: number) => `#${color.toString(16).padStart(6, '0')}`;

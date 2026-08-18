import Phaser from 'phaser';
import { RENDER_SCALE } from '@/core/constants';

/** Único sitio donde se define la tipografía, para que todo el juego sea coherente. */
export const FONT = 'monospace';

export type TextSize = 'micro' | 'small' | 'body' | 'title' | 'huge';

/** Tamaños en unidades de mundo (480x270). */
const SIZES: Record<TextSize, number> = {
  micro: 7,
  small: 9,
  body: 11,
  title: 18,
  huge: 26,
};

/**
 * Crea texto nítido.
 *
 * El truco: la fuente se pide a `RENDER_SCALE` veces su tamaño y el objeto se
 * dibuja a la escala inversa. Así la textura del texto se genera con el doble de
 * píxeles y, como la cámara aplica `RENDER_SCALE` de zoom, acaba mostrándose 1:1
 * contra los píxeles del dispositivo en vez de ampliada e ilegible.
 *
 * Las coordenadas siguen siendo las del mundo, así que nada más cambia.
 */
export function label(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  size: TextSize = 'body',
  color = '#d7e3ff',
): Phaser.GameObjects.Text {
  return scene.add
    .text(x, y, text, {
      fontFamily: FONT,
      fontSize: `${SIZES[size] * RENDER_SCALE}px`,
      color,
    })
    .setScale(1 / RENDER_SCALE);
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
  return label(scene, x, y, text, size, color).setShadow(
    0,
    0,
    color,
    6 * RENDER_SCALE,
    true,
    true,
  );
}

/**
 * Ajusta el ancho de ajuste de línea en unidades de mundo.
 *
 * Hace falta porque `setWordWrapWidth` trabaja en el espacio interno del texto,
 * que está a `RENDER_SCALE`; pasarle el ancho tal cual partiría las líneas a la
 * mitad de lo previsto.
 */
export function wrap(text: Phaser.GameObjects.Text, width: number) {
  return text.setWordWrapWidth(width * RENDER_SCALE);
}

/** Interlineado en unidades de mundo. */
export function lineGap(text: Phaser.GameObjects.Text, spacing: number) {
  return text.setLineSpacing(spacing * RENDER_SCALE);
}

export const hex = (color: number) => `#${color.toString(16).padStart(6, '0')}`;

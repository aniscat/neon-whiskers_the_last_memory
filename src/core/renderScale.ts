import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, RENDER_SCALE } from './constants';

/**
 * Pone la cámara de una escena en el zoom de render.
 *
 * El canvas mide `GAME_WIDTH * RENDER_SCALE` píxeles, pero con este zoom la cámara
 * sigue mostrando exactamente `GAME_WIDTH x GAME_HEIGHT` unidades de mundo. Es
 * decir: todas las coordenadas de las escenas siguen siendo las mismas, y a cambio
 * hay el doble de píxeles reales, que es lo que permite dibujar texto nítido.
 *
 * Hay que llamarlo al principio de `create()` en TODAS las escenas visibles, o esa
 * escena se dibujará al doble de tamaño y descuadrada.
 */
export function applyRenderScale(scene: Phaser.Scene) {
  const cam = scene.cameras.main;
  cam.setZoom(RENDER_SCALE);
  // Con zoom, Phaser centra la vista en el punto medio del mundo visible; hay que
  // anclarla en la esquina para que (0,0) siga siendo la esquina de la pantalla.
  cam.centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
  return cam;
}

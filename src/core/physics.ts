/**
 * Física del movimiento de Nova, con las cotas derivadas de ella.
 *
 * Está en su propio módulo (sin dependencias de Phaser) para que las pruebas de
 * `tests/geometry.test.ts` puedan comprobar que cada plataforma de cada zona es
 * realmente alcanzable. Un escalón de 54 px con un salto de 46 px es un nivel
 * imposible, y eso debe fallar en CI, no en las manos del jugador.
 */
export const GRAVITY = 900;
export const RUN_SPEED = 130;
export const JUMP_VELOCITY = 330;

/** Altura máxima de un salto: v² / (2·g). */
export const JUMP_HEIGHT = (JUMP_VELOCITY * JUMP_VELOCITY) / (2 * GRAVITY);

/** Tiempo total en el aire de un salto que sale y vuelve a la misma altura: 2·v / g. */
export const JUMP_AIR_TIME = (2 * JUMP_VELOCITY) / GRAVITY;

/** Distancia horizontal que se cubre en un salto simple. */
export const JUMP_REACH = RUN_SPEED * JUMP_AIR_TIME;

/**
 * Con el doble salto se gana otra altura completa si el segundo impulso se da en
 * el ápice, y algo menos de un tiempo de vuelo extra.
 */
export const DOUBLE_JUMP_HEIGHT = JUMP_HEIGHT * 2;
export const DOUBLE_JUMP_REACH = RUN_SPEED * (JUMP_AIR_TIME * 1.5);

/** Margen de seguridad al diseñar niveles: no apurar las cotas al límite. */
export const DESIGN_MARGIN = 0.92;

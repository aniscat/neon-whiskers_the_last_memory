import Phaser from 'phaser';
import { ALL_SHEETS, ANIM, IMAGES, animKey, type SheetSpec } from './assets';
import { CAT_VARIANTS } from '@shared/npcs';

/** Encola todos los spritesheets y las imágenes sueltas. */
export function queueAssets(scene: Phaser.Scene) {
  for (const s of ALL_SHEETS) {
    scene.load.spritesheet(s.key, s.url, {
      frameWidth: s.frameWidth,
      frameHeight: s.frameHeight,
    });
  }
  for (const img of IMAGES) scene.load.image(img.key, img.url);
}

export interface SheetReport extends SheetSpec {
  actualWidth: number;
  actualHeight: number;
  frames: number;
  /** El ancho real no coincide con el esperado: probablemente cambió el pack. */
  mismatch: boolean;
}

/**
 * Comprueba contra el PNG cargado que las medidas del manifiesto siguen siendo
 * correctas. Si alguien sustituye los packs por otros, esto lo detecta en el
 * arranque en vez de dejar frames cortados a medias.
 */
export function auditSheets(scene: Phaser.Scene): SheetReport[] {
  return ALL_SHEETS.map((spec) => {
    const texture = scene.textures.get(spec.key);
    const source = texture.getSourceImage() as HTMLImageElement;
    const actualWidth = source.width ?? 0;
    const actualHeight = source.height ?? 0;
    return {
      ...spec,
      actualWidth,
      actualHeight,
      frames: texture.frameTotal - 1, // Phaser incluye el frame "__BASE"
      mismatch: actualWidth !== spec.expectedWidth || actualHeight !== spec.frameHeight,
    };
  });
}

/** Índice del último frame disponible de una textura. */
const lastFrame = (scene: Phaser.Scene, key: string) =>
  Math.max(0, scene.textures.get(key).frameTotal - 2);

/**
 * Registra las animaciones de un gato. Los packs solo traen `idle` y `jump`, así
 * que el resto se deriva: correr es idle acelerado, y dash/escalada reutilizan
 * frames concretos del salto combinados con transformaciones en el sprite.
 */
export function createCatAnimations(scene: Phaser.Scene, variant: string) {
  const idleKey = `cat:${variant}:idle`;
  const jumpKey = `cat:${variant}:jump`;
  if (!scene.textures.exists(idleKey) || !scene.textures.exists(jumpKey)) return;

  const idleLast = lastFrame(scene, idleKey);
  const jumpLast = lastFrame(scene, jumpKey);
  // El salto es un arco: primer tercio es impulso, último tercio es caída.
  const rise = Math.max(1, Math.floor(jumpLast * 0.35));
  const apex = Math.floor(jumpLast * 0.5);

  const add = (
    name: string,
    key: string,
    frames: number[],
    frameRate: number,
    repeat: number,
  ) => {
    const animId = animKey(variant, name);
    if (scene.anims.exists(animId)) return;
    scene.anims.create({
      key: animId,
      frames: frames.map((f) => ({ key, frame: f })),
      frameRate,
      repeat,
    });
  };

  const range = (from: number, to: number) =>
    Array.from({ length: Math.max(1, to - from + 1) }, (_, i) => from + i);

  add(ANIM.idle, idleKey, range(0, idleLast), 6, -1);
  add(ANIM.run, idleKey, range(0, idleLast), 16, -1);
  add(ANIM.jumpRise, jumpKey, range(0, rise), 14, 0);
  add(ANIM.jumpFall, jumpKey, range(rise + 1, jumpLast), 10, 0);
  add(ANIM.doubleJump, jumpKey, range(0, jumpLast), 22, 0);
  add(ANIM.dash, jumpKey, [apex], 1, 0);
  add(ANIM.climb, jumpKey, [rise, apex], 8, -1);
  add(ANIM.hurt, idleKey, [0], 1, 0);
}

export function createAllCatAnimations(scene: Phaser.Scene) {
  for (const variant of CAT_VARIANTS) createCatAnimations(scene, variant);
}

/** Animaciones de los objetos del pack (ratón y pelotas rodando). */
export function createPropAnimations(scene: Phaser.Scene) {
  const props: Array<[string, number]> = [
    ['prop:mouse', 10],
    ['prop:ball-blue', 12],
    ['prop:ball-orange', 12],
    ['prop:ball-pink', 12],
  ];
  for (const [key, frameRate] of props) {
    if (!scene.textures.exists(key) || scene.anims.exists(`${key}:loop`)) continue;
    scene.anims.create({
      key: `${key}:loop`,
      frames: scene.anims.generateFrameNumbers(key, {
        start: 0,
        end: lastFrame(scene, key),
      }),
      frameRate,
      repeat: -1,
    });
  }
}

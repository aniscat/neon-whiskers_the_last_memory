import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, PALETTE } from '@/core/constants';

interface LayerSpec {
  /** Factor de parallax: 0 = fijo al fondo, 1 = pegado al mundo. */
  scroll: number;
  color: number;
  alpha: number;
  minHeight: number;
  maxHeight: number;
  minWidth: number;
  maxWidth: number;
  /** Probabilidad de que un edificio lleve ventanas encendidas. */
  litChance: number;
  windowColor: number;
}

const LAYERS: LayerSpec[] = [
  {
    scroll: 0.08,
    color: 0x0a0f24,
    alpha: 1,
    minHeight: 90,
    maxHeight: 190,
    minWidth: 26,
    maxWidth: 54,
    litChance: 0.1,
    windowColor: PALETTE.neonViolet,
  },
  {
    scroll: 0.2,
    color: 0x0d1330,
    alpha: 1,
    minHeight: 60,
    maxHeight: 140,
    minWidth: 18,
    maxWidth: 40,
    litChance: 0.25,
    windowColor: PALETTE.neonCyan,
  },
  {
    scroll: 0.4,
    color: 0x111838,
    alpha: 1,
    minHeight: 40,
    maxHeight: 100,
    minWidth: 12,
    maxWidth: 30,
    litChance: 0.4,
    windowColor: PALETTE.neonPink,
  },
];

/** Ancho del tile generado: suficiente para que la repetición no se note. */
const TILE_WIDTH = GAME_WIDTH * 2;

/**
 * Skyline cyberpunk generado enteramente por código: tres capas de rascacielos
 * con ventanas encendidas, degradado de cielo, resplandor de neón y letreros
 * parpadeantes. No usa ningún asset externo.
 */
export class NeonCityBackground {
  private readonly layers: Phaser.GameObjects.TileSprite[] = [];
  private readonly signs: Phaser.GameObjects.Rectangle[] = [];
  private readonly container: Phaser.GameObjects.Container;
  private readonly scrim: Phaser.GameObjects.Rectangle;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly seed: string,
    depth = -100,
  ) {
    this.container = scene.add.container(0, 0).setDepth(depth);

    this.container.add(this.buildSky());

    LAYERS.forEach((spec, index) => {
      const key = this.textureKey(index);
      if (!scene.textures.exists(key)) this.bakeLayer(key, spec, index);

      const tile = scene.add
        .tileSprite(0, GAME_HEIGHT, TILE_WIDTH, spec.maxHeight + 8, key)
        .setOrigin(0, 1)
        .setScrollFactor(0)
        .setAlpha(spec.alpha);
      this.layers.push(tile);
      this.container.add(tile);
    });

    // Velo oscuro sobre el skyline: sin él, los rascacielos con ventanas de neón
    // compiten con las plataformas y no se distingue dónde se puede pisar.
    this.scrim = scene.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, PALETTE.night, 0.55)
      .setOrigin(0, 0)
      .setScrollFactor(0);
    this.container.add(this.scrim);

    this.buildSigns();
  }

  /** Degradado vertical del cielo lluvioso, pintado franja a franja. */
  private buildSky() {
    const sky = this.scene.add.graphics().setScrollFactor(0);
    const steps = 24;
    const top = Phaser.Display.Color.IntegerToColor(PALETTE.night);
    const bottom = Phaser.Display.Color.IntegerToColor(0x2a1740);

    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(top, bottom, 1, t);
      sky.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), 1);
      sky.fillRect(0, (GAME_HEIGHT / steps) * i, GAME_WIDTH, GAME_HEIGHT / steps + 1);
    }
    return sky;
  }

  private textureKey(index: number) {
    return `bg:${this.seed}:${index}`;
  }

  /**
   * Dibuja una capa de edificios en un Graphics y la hornea a textura para
   * poder usarla como TileSprite (parallax barato, sin miles de objetos).
   */
  private bakeLayer(key: string, spec: LayerSpec, index: number) {
    const rng = new Phaser.Math.RandomDataGenerator([`${this.seed}:${index}`]);
    const height = spec.maxHeight + 8;
    const g = this.scene.make.graphics({ x: 0, y: 0 }, false);

    let x = 0;
    while (x < TILE_WIDTH) {
      const w = rng.between(spec.minWidth, spec.maxWidth);
      const h = rng.between(spec.minHeight, spec.maxHeight);
      const top = height - h;

      g.fillStyle(spec.color, 1);
      g.fillRect(x, top, w, h);

      // Borde superior con un hilo de neón: da la lectura cyberpunk.
      g.fillStyle(spec.windowColor, 0.35);
      g.fillRect(x, top, w, 1);

      // Antenas ocasionales.
      if (rng.frac() < 0.25) {
        g.fillStyle(spec.color, 1);
        g.fillRect(x + Math.floor(w / 2), top - rng.between(4, 14), 1, 14);
      }

      // Ventanas en rejilla, algunas encendidas.
      if (rng.frac() < 0.9) {
        for (let wy = top + 4; wy < height - 3; wy += 5) {
          for (let wx = x + 2; wx < x + w - 2; wx += 4) {
            if (rng.frac() > spec.litChance) continue;
            g.fillStyle(spec.windowColor, rng.realInRange(0.25, 0.9));
            g.fillRect(wx, wy, 2, 2);
          }
        }
      }

      x += w + rng.between(1, 5);
    }

    g.generateTexture(key, TILE_WIDTH, height);
    g.destroy();
  }

  /** Letreros de neón que parpadean con ritmos distintos. */
  private buildSigns() {
    const rng = new Phaser.Math.RandomDataGenerator([`${this.seed}:signs`]);
    const colors = [PALETTE.neonPink, PALETTE.neonCyan, PALETTE.neonAmber, PALETTE.neonViolet];

    for (let i = 0; i < 7; i++) {
      const sign = this.scene.add
        .rectangle(
          rng.between(10, GAME_WIDTH - 10),
          rng.between(30, GAME_HEIGHT - 90),
          rng.between(3, 6),
          rng.between(10, 26),
          colors[rng.between(0, colors.length - 1)],
          rng.realInRange(0.3, 0.6),
        )
        .setScrollFactor(0);

      this.scene.tweens.add({
        targets: sign,
        alpha: { from: sign.alpha, to: 0.05 },
        duration: rng.between(400, 2200),
        yoyo: true,
        repeat: -1,
        delay: rng.between(0, 1500),
      });

      this.signs.push(sign);
      this.container.add(sign);
    }
  }

  /**
   * Desplaza las capas según la cámara. Se llama desde el `update` de la escena
   * porque los TileSprite están fijos y movemos su `tilePositionX`.
   */
  update(cameraScrollX: number, cameraScrollY: number) {
    this.layers.forEach((tile, i) => {
      const spec = LAYERS[i];
      tile.tilePositionX = cameraScrollX * spec.scroll;
      tile.y = GAME_HEIGHT + cameraScrollY * spec.scroll * 0.25;
    });
  }

  /** Tiñe el cielo cuando la simulación se degrada. */
  setCorruption(amount: number) {
    this.layers.forEach((tile, i) => {
      tile.setAlpha(LAYERS[i].alpha * (1 - amount * 0.3));
    });
    // La ciudad se apaga distrito por distrito: el velo se cierra sobre ella.
    this.scrim.setAlpha(0.55 + amount * 0.25);
    this.signs.forEach((sign) => sign.setScale(1, 1 - amount * 0.5));
  }

  destroy() {
    this.container.destroy(true);
  }
}

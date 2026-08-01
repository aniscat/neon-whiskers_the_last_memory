import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, PALETTE } from '@/core/constants';

const DROP_TEXTURE = 'fx:raindrop';
const SPLASH_TEXTURE = 'fx:splash';

/**
 * Lluvia procedural. Es un emisor de partículas fijo a la cámara con gotas
 * inclinadas; cuando la corrupción sube, la lluvia puede invertirse y caer
 * hacia arriba, uno de los "fallos en la realidad" del guion.
 */
export class RainSystem {
  private readonly emitter: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly splashes: Phaser.GameObjects.Particles.ParticleEmitter;
  private inverted = false;

  constructor(
    private readonly scene: Phaser.Scene,
    depth = 90,
  ) {
    this.ensureTextures();

    this.emitter = scene.add
      .particles(0, 0, DROP_TEXTURE, {
        x: { min: -40, max: GAME_WIDTH + 40 },
        y: -8,
        lifespan: 900,
        speedY: { min: 260, max: 380 },
        speedX: { min: -70, max: -40 },
        scaleY: { min: 0.7, max: 1.6 },
        alpha: { min: 0.18, max: 0.5 },
        quantity: 3,
        frequency: 16,
        blendMode: Phaser.BlendModes.ADD,
      })
      .setScrollFactor(0)
      .setDepth(depth);

    // Salpicaduras en la parte baja de la pantalla: sugieren charcos sin dibujarlos.
    this.splashes = scene.add
      .particles(0, 0, SPLASH_TEXTURE, {
        x: { min: 0, max: GAME_WIDTH },
        y: GAME_HEIGHT - 2,
        lifespan: 260,
        speedY: { min: -30, max: -10 },
        speedX: { min: -12, max: 12 },
        alpha: { start: 0.4, end: 0 },
        quantity: 1,
        frequency: 60,
        blendMode: Phaser.BlendModes.ADD,
      })
      .setScrollFactor(0)
      .setDepth(depth - 1);
  }

  private ensureTextures() {
    if (!this.scene.textures.exists(DROP_TEXTURE)) {
      const g = this.scene.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(PALETTE.rain, 1).fillRect(0, 0, 1, 6);
      g.generateTexture(DROP_TEXTURE, 1, 6);
      g.destroy();
    }
    if (!this.scene.textures.exists(SPLASH_TEXTURE)) {
      const g = this.scene.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(PALETTE.bone, 1).fillRect(0, 0, 1, 1);
      g.generateTexture(SPLASH_TEXTURE, 1, 1);
      g.destroy();
    }
  }

  /** Intensidad 0..1: controla cuántas gotas por segundo caen. */
  setIntensity(intensity: number) {
    const clamped = Phaser.Math.Clamp(intensity, 0, 1);
    this.emitter.frequency = Phaser.Math.Linear(60, 8, clamped);
    this.emitter.quantity = Math.max(1, Math.round(Phaser.Math.Linear(1, 5, clamped)));
    this.splashes.setVisible(!this.inverted && clamped > 0.2);
  }

  /** "La lluvia cae hacia arriba": glitch narrativo de las zonas corrompidas. */
  setInverted(inverted: boolean) {
    if (inverted === this.inverted) return;
    this.inverted = inverted;

    // `setParticleSpeed` solo acepta escalares, así que reconfiguramos los rangos.
    this.emitter.ops.speedX.onChange(inverted ? 55 : -55);
    this.emitter.ops.speedY.onChange(inverted ? -320 : 320);
    this.emitter.setPosition(0, inverted ? GAME_HEIGHT + 8 : -8);
    this.splashes.setVisible(!inverted);
  }

  setVisible(visible: boolean) {
    this.emitter.setVisible(visible);
    this.splashes.setVisible(visible && !this.inverted);
  }

  destroy() {
    this.emitter.destroy();
    this.splashes.destroy();
  }
}

import Phaser from 'phaser';
import { PALETTE } from '@/core/constants';
import type { PuzzlePlateDef } from './ZoneDefinition';

/**
 * Placa de presión. Permanece activa `holdMs` tras pisarla; el acertijo de la
 * zona se resuelve cuando todas las placas de un grupo están activas a la vez.
 */
export class PuzzlePlate extends Phaser.GameObjects.Zone {
  readonly group: string;
  private readonly holdMs: number;
  private readonly art: Phaser.GameObjects.Rectangle;
  private activeUntil = 0;

  constructor(scene: Phaser.Scene, def: PuzzlePlateDef) {
    super(scene, def.x, def.y, 22, 8);
    this.group = def.group;
    this.holdMs = def.holdMs ?? 1800;

    scene.add.existing(this);
    scene.physics.add.existing(this, true);

    this.art = scene.add
      .rectangle(def.x, def.y, 22, 4, PALETTE.neonAmber, 0.35)
      .setDepth(-4)
      .setBlendMode(Phaser.BlendModes.ADD);
  }

  get isActive() {
    return this.scene.time.now < this.activeUntil;
  }

  /** Fracción de tiempo restante, para dibujar la cuenta atrás. */
  get remaining() {
    return Phaser.Math.Clamp((this.activeUntil - this.scene.time.now) / this.holdMs, 0, 1);
  }

  press() {
    if (this.isActive) {
      this.activeUntil = this.scene.time.now + this.holdMs;
      return;
    }
    this.activeUntil = this.scene.time.now + this.holdMs;
    this.scene.tweens.add({ targets: this.art, scaleY: { from: 0.4, to: 1 }, duration: 120 });
  }

  /** Actualiza el color según el tiempo que le queda de activación. */
  refresh() {
    if (this.isActive) {
      this.art.setFillStyle(PALETTE.neonCyan, 0.35 + this.remaining * 0.55);
    } else {
      this.art.setFillStyle(PALETTE.neonAmber, 0.35);
    }
  }
}

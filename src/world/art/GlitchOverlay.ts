import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, PALETTE } from '@/core/constants';

/**
 * "Fallos en la realidad". Implementado con objetos normales en vez de un shader
 * a medida para que funcione igual en WebGL y en Canvas: líneas de escaneo,
 * bandas de datos desplazadas, sacudidas de cámara y viñeta.
 *
 * La intensidad la marca `GameState.corrupcion`.
 */
export class GlitchOverlay {
  private readonly scanlines: Phaser.GameObjects.Graphics;
  private readonly bands: Phaser.GameObjects.Rectangle[] = [];
  private readonly vignette: Phaser.GameObjects.Graphics;
  private intensity = 0;
  private nextGlitchAt = 0;

  constructor(private readonly scene: Phaser.Scene, depth = 95) {
    this.scanlines = scene.add.graphics().setScrollFactor(0).setDepth(depth).setAlpha(0);
    for (let y = 0; y < GAME_HEIGHT; y += 2) {
      this.scanlines.fillStyle(0x000000, 0.35).fillRect(0, y, GAME_WIDTH, 1);
    }

    this.vignette = scene.add.graphics().setScrollFactor(0).setDepth(depth - 1).setAlpha(0);
    for (let i = 0; i < 24; i++) {
      this.vignette.lineStyle(2, 0x000000, 0.05).strokeRect(-i, -i, GAME_WIDTH + i * 2, GAME_HEIGHT + i * 2);
    }

    // Bandas reutilizables: se reposicionan en cada glitch en vez de crearse.
    for (let i = 0; i < 4; i++) {
      this.bands.push(
        scene.add
          .rectangle(0, 0, GAME_WIDTH, 6, PALETTE.neonCyan, 0)
          .setOrigin(0, 0.5)
          .setScrollFactor(0)
          .setDepth(depth)
          .setBlendMode(Phaser.BlendModes.ADD),
      );
    }
  }

  setIntensity(intensity: number) {
    this.intensity = Phaser.Math.Clamp(intensity, 0, 1);
    this.scanlines.setAlpha(this.intensity * 0.5);
    this.vignette.setAlpha(this.intensity * 0.8);
  }

  update(time: number) {
    if (this.intensity <= 0.05 || time < this.nextGlitchAt) return;

    // Cuanto más corrupta la simulación, más a menudo falla.
    this.nextGlitchAt = time + Phaser.Math.Between(600, 4200) * (1 - this.intensity * 0.8);
    this.burst();
  }

  /** Un parpadeo de bandas desplazadas más una sacudida corta de cámara. */
  private burst() {
    const colors = [PALETTE.neonCyan, PALETTE.neonPink, PALETTE.neonViolet];

    this.bands.forEach((band, i) => {
      band
        .setPosition(Phaser.Math.Between(-8, 8), Phaser.Math.Between(0, GAME_HEIGHT))
        .setSize(GAME_WIDTH, Phaser.Math.Between(2, 8))
        .setFillStyle(colors[i % colors.length], 0.35 * this.intensity);

      this.scene.tweens.add({
        targets: band,
        alpha: 0,
        duration: Phaser.Math.Between(70, 220),
        onComplete: () => band.setFillStyle(colors[i % colors.length], 0),
      });
      band.setAlpha(1);
    });

    if (this.intensity > 0.45) {
      this.scene.cameras.main.shake(90, 0.002 * this.intensity);
    }
  }

  destroy() {
    this.scanlines.destroy();
    this.vignette.destroy();
    this.bands.forEach((b) => b.destroy());
  }
}

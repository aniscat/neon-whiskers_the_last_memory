import Phaser from 'phaser';
import { applyRenderScale } from '@/core/renderScale';
import { GAME_HEIGHT, GAME_WIDTH, PALETTE, SCENES } from '@/core/constants';
import { label, neonLabel } from '@/ui/text';

/**
 * Escena mínima: dibuja la barra de carga y pasa a Preload. No carga assets
 * para que la barra aparezca de inmediato.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.boot);
  }

  create() {
    applyRenderScale(this);
    this.cameras.main.setBackgroundColor(PALETTE.night);

    const title = neonLabel(
      this,
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 - 14,
      'NEON WHISKERS',
      'title',
      '#3fe0d0',
    ).setOrigin(0.5);

    label(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 4, 'the last memory', 'small', '#6f8bd0')
      .setOrigin(0.5);

    this.tweens.add({
      targets: title,
      alpha: { from: 0.4, to: 1 },
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    this.scene.launch(SCENES.preload);
  }
}

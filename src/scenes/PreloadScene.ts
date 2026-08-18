import Phaser from 'phaser';
import { applyRenderScale } from '@/core/renderScale';
import { DEBUG, GAME_HEIGHT, GAME_WIDTH, PALETTE, SCENES } from '@/core/constants';
import {
  auditSheets,
  createAllCatAnimations,
  createPropAnimations,
  queueAssets,
} from '@/core/SpriteSheetLoader';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SCENES.preload);
  }

  preload() {
    const barWidth = 160;
    const x = (GAME_WIDTH - barWidth) / 2;
    const y = GAME_HEIGHT / 2 + 30;

    const frame = this.add.graphics();
    frame.lineStyle(1, PALETTE.neonViolet, 0.8).strokeRect(x - 1, y - 1, barWidth + 2, 5);

    const bar = this.add.graphics();
    this.load.on(Phaser.Loader.Events.PROGRESS, (p: number) => {
      bar.clear().fillStyle(PALETTE.neonCyan, 1).fillRect(x, y, barWidth * p, 3);
    });

    queueAssets(this);
  }

  create() {
    applyRenderScale(this);
    createAllCatAnimations(this);
    createPropAnimations(this);

    const problems = auditSheets(this).filter((r) => r.mismatch);
    if (problems.length > 0) {
      console.warn(
        '[assets] Medidas inesperadas en estos spritesheets; revisa src/core/assets.ts',
        problems,
      );
    }

    this.scene.stop(SCENES.boot);
    this.scene.start(DEBUG.has('sheets') ? SCENES.debugSheets : SCENES.menu);
  }
}

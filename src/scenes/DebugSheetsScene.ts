import Phaser from 'phaser';
import { applyRenderScale } from '@/core/renderScale';
import { GAME_WIDTH, PALETTE, SCENES } from '@/core/constants';
import { ANIM, animKey } from '@/core/assets';
import { auditSheets } from '@/core/SpriteSheetLoader';
import { CAT_VARIANTS } from '@shared/npcs';
import { label } from '@/ui/text';

/**
 * Escena de verificación visual (`?debug=sheets`): muestra cada variante de gato
 * reproduciendo todas sus animaciones derivadas, con las medidas detectadas.
 * Sirve para confirmar que ningún frame queda cortado.
 */
export class DebugSheetsScene extends Phaser.Scene {
  constructor() {
    super(SCENES.debugSheets);
  }

  create() {
    applyRenderScale(this);
    this.cameras.main.setBackgroundColor(PALETTE.deepBlue);
    const report = auditSheets(this);

    label(this, 4, 2, 'DEBUG SHEETS — flechas para desplazar', 'small', '#ffb347');

    const anims = [ANIM.idle, ANIM.run, ANIM.jumpRise, ANIM.jumpFall, ANIM.dash, ANIM.climb];
    let y = 22;

    for (const variant of CAT_VARIANTS) {
      const idle = report.find((r) => r.key === `cat:${variant}:idle`);
      const jump = report.find((r) => r.key === `cat:${variant}:jump`);
      const broken = idle?.mismatch || jump?.mismatch;

      label(this, 4, y, variant, 'small', broken ? '#ff2f6d' : '#d7e3ff');
      label(
        this,
        4,
        y + 10,
        `idle ${idle?.frames ?? 0}f  jump ${jump?.frames ?? 0}f`,
        'micro',
        '#6f8bd0',
      );

      anims.forEach((name, i) => {
        const sprite = this.add
          .sprite(84 + i * 40, y + 14, `cat:${variant}:idle`)
          .setOrigin(0.5);
        sprite.play(animKey(variant, name));
        label(this, 84 + i * 40, y + 30, name, 'micro', '#8b5cff').setOrigin(0.5);
      });

      y += 40;
    }

    label(this, 4, y, 'props', 'small', '#d7e3ff');
    ['prop:mouse', 'prop:ball-blue', 'prop:ball-orange', 'prop:ball-pink'].forEach((key, i) => {
      this.add.sprite(84 + i * 40, y + 14, key).play(`${key}:loop`);
    });
    this.add.image(84 + 4 * 40, y + 14, 'prop:cat-bed');
    this.add.image(84 + 5 * 40, y + 14, 'prop:cat-bowls');

    this.cameras.main.setBounds(0, 0, GAME_WIDTH, y + 50);

    const cursors = this.input.keyboard!.createCursorKeys();
    this.events.on(Phaser.Scenes.Events.UPDATE, () => {
      if (cursors.down.isDown) this.cameras.main.scrollY += 3;
      if (cursors.up.isDown) this.cameras.main.scrollY -= 3;
    });

    this.input.keyboard!.once('keydown-ESC', () => this.scene.start(SCENES.menu));
  }
}

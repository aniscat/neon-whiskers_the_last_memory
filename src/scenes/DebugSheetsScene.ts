import Phaser from 'phaser';
import { GAME_WIDTH, PALETTE, SCENES } from '@/core/constants';
import { ANIM, animKey } from '@/core/assets';
import { auditSheets } from '@/core/SpriteSheetLoader';
import { CAT_VARIANTS } from '@shared/npcs';

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
    this.cameras.main.setBackgroundColor(PALETTE.deepBlue);
    const report = auditSheets(this);

    this.add.text(4, 2, 'DEBUG SHEETS — flechas para desplazar', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#ffb347',
    });

    const anims = [ANIM.idle, ANIM.run, ANIM.jumpRise, ANIM.jumpFall, ANIM.dash, ANIM.climb];
    let y = 22;

    for (const variant of CAT_VARIANTS) {
      const idle = report.find((r) => r.key === `cat:${variant}:idle`);
      const jump = report.find((r) => r.key === `cat:${variant}:jump`);

      this.add.text(4, y, variant, {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: idle?.mismatch || jump?.mismatch ? '#ff2f6d' : '#d7e3ff',
      });
      this.add.text(4, y + 10, `idle ${idle?.frames ?? 0}f  jump ${jump?.frames ?? 0}f`, {
        fontFamily: 'monospace',
        fontSize: '6px',
        color: '#6f8bd0',
      });

      anims.forEach((name, i) => {
        const sprite = this.add
          .sprite(84 + i * 40, y + 14, `cat:${variant}:idle`)
          .setOrigin(0.5);
        sprite.play(animKey(variant, name));
        this.add
          .text(84 + i * 40, y + 30, name, {
            fontFamily: 'monospace',
            fontSize: '6px',
            color: '#8b5cff',
          })
          .setOrigin(0.5);
      });

      y += 40;
    }

    // Objetos del pack.
    this.add.text(4, y, 'props', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#d7e3ff',
    });
    ['prop:mouse', 'prop:ball-blue', 'prop:ball-orange', 'prop:ball-pink'].forEach((key, i) => {
      this.add.sprite(84 + i * 40, y + 14, key).play(`${key}:loop`);
    });
    this.add.image(84 + 4 * 40, y + 14, 'prop:cat-bed');
    this.add.image(84 + 5 * 40, y + 14, 'prop:cat-bowls');

    const totalHeight = y + 50;
    this.cameras.main.setBounds(0, 0, GAME_WIDTH, totalHeight);

    const cursors = this.input.keyboard!.createCursorKeys();
    this.events.on(Phaser.Scenes.Events.UPDATE, () => {
      if (cursors.down.isDown) this.cameras.main.scrollY += 3;
      if (cursors.up.isDown) this.cameras.main.scrollY -= 3;
    });

    this.input.keyboard!.once('keydown-ESC', () => this.scene.start(SCENES.menu));
  }
}

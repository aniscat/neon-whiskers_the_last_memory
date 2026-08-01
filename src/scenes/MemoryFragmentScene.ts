import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, PALETTE, SCENES } from '@/core/constants';
import { GameState } from '@/core/GameState';
import { EventBus } from '@/core/EventBus';
import { getFragment } from '@shared/lore';
import { drawPanel } from '@/ui/Panel';
import { Typewriter } from '@/ui/Typewriter';
import { label } from '@/ui/text';

export interface MemoryFragmentSceneData {
  fragmentId: string;
}

/**
 * Visor de un fragmento recogido. Antes del giro muestra el texto "humano"; una
 * vez revelada la verdad, el mismo fragmento muestra además lo que significaba
 * en realidad. Es el mecanismo que reinterpreta toda la aventura.
 */
export class MemoryFragmentScene extends Phaser.Scene {
  private typewriter!: Typewriter;

  constructor() {
    super({ key: SCENES.fragment, active: false });
  }

  create(data: MemoryFragmentSceneData) {
    const fragment = getFragment(data.fragmentId);
    if (!fragment) {
      this.close();
      return;
    }

    this.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, PALETTE.night, 0.72)
      .setOrigin(0, 0)
      .setScrollFactor(0);

    const w = GAME_WIDTH - 60;
    const h = 118;
    const x = 30;
    const y = (GAME_HEIGHT - h) / 2;
    drawPanel(this, x, y, w, h, PALETTE.neonViolet);

    label(this, x + 8, y + 7, 'FRAGMENTO DE MEMORIA', 'micro', '#8b5cff');
    label(this, x + 8, y + 18, fragment.titulo.toUpperCase(), 'small', '#d7e3ff');

    const body = label(this, x + 8, y + 34, '', 'micro', '#a8b8e8')
      .setWordWrapWidth(w - 16)
      .setLineSpacing(3);

    this.typewriter = new Typewriter(this, body, { speed: 18, punctuationPause: 140 });
    this.typewriter.start(fragment.texto);

    // Tras el giro, cada fragmento revela su segunda capa.
    if (GameState.flags.verdadRevelada) {
      const truth = label(this, x + 8, y + h - 34, '', 'micro', '#ff8bb0')
        .setWordWrapWidth(w - 16)
        .setLineSpacing(3);
      this.time.delayedCall(900, () => {
        new Typewriter(this, truth, { speed: 22 }).start(fragment.verdad);
      });
    }

    const hint = label(this, x + w - 8, y + h - 10, 'ENTER cerrar', 'micro', '#3a4770').setOrigin(
      1,
      1,
    );
    this.tweens.add({
      targets: hint,
      alpha: { from: 0.4, to: 1 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    const dismiss = () => {
      if (!this.typewriter.isDone) {
        this.typewriter.skip();
        return;
      }
      this.close();
    };
    this.input.keyboard!.on('keydown-ENTER', dismiss);
    this.input.keyboard!.on('keydown-SPACE', dismiss);
    this.input.keyboard!.on('keydown-ESC', () => this.close());

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.typewriter.destroy();
      this.input.keyboard?.removeAllListeners();
    });
  }

  private close() {
    EventBus.emit('dialogue:closed');
    this.scene.stop();
  }
}

import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, PALETTE, SCENES } from '@/core/constants';
import { RainSystem } from '@/world/art/RainSystem';
import { Typewriter } from '@/ui/Typewriter';
import { label, neonLabel } from '@/ui/text';
import { GameState } from '@/core/GameState';
import { ANIM, animKey } from '@/core/assets';
import { PLAYER_SPRITE } from '@shared/npcs';

/** Cada línea del prólogo, tal como aparece en el guion. */
const PROLOGUE = [
  'En el año 2198 los humanos desaparecieron.',
  'No hubo guerra.',
  'No hubo una invasión.',
  'Simplemente dejaron de existir.',
  'Las ciudades siguieron funcionando gracias a una inteligencia artificial llamada MOTHER,\ncreada para mantener el equilibrio del planeta.',
  'Durante décadas, MOTHER continuó fabricando robots, drones y alimentos...\nesperando que los humanos regresaran.',
  'Nunca lo hicieron.',
  'Con el tiempo, los únicos seres vivos que sobrevivieron fueron los gatos.',
  'Uno de esos gatos despierta sin recuerdos.',
  'Su nombre aparece únicamente en un collar electrónico:',
];

export class IntroScene extends Phaser.Scene {
  private typewriter!: Typewriter;
  private line = 0;
  private text!: Phaser.GameObjects.Text;
  private prompt!: Phaser.GameObjects.Text;

  constructor() {
    super(SCENES.intro);
  }

  create() {
    this.cameras.main.setBackgroundColor(PALETTE.night);
    new RainSystem(this, 5).setIntensity(0.35);

    this.text = label(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, '', 'body', '#d7e3ff')
      .setOrigin(0.5)
      .setAlign('center')
      .setLineSpacing(4)
      .setWordWrapWidth(GAME_WIDTH - 60);

    this.prompt = label(this, GAME_WIDTH - 8, GAME_HEIGHT - 10, '', 'micro', '#6f8bd0')
      .setOrigin(1, 1)
      .setAlpha(0);

    this.typewriter = new Typewriter(this, this.text, {
      speed: 34,
      punctuationPause: 340,
      onDone: () => this.showPrompt(),
    });

    label(this, 6, GAME_HEIGHT - 10, 'ESC saltar', 'micro', '#3a4770');
    this.input.keyboard!.on('keydown-ESC', () => this.finish());

    const advance = () => {
      if (!this.typewriter.isDone) {
        this.typewriter.skip();
        return;
      }
      this.next();
    };
    this.input.keyboard!.on('keydown-ENTER', advance);
    this.input.keyboard!.on('keydown-SPACE', advance);
    this.input.on(Phaser.Input.Events.POINTER_DOWN, advance);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.typewriter.destroy();
      this.input.keyboard?.removeAllListeners();
    });

    this.next();
  }

  private showPrompt() {
    this.tweens.add({ targets: this.prompt, alpha: 1, duration: 400 });
    this.tweens.add({
      targets: this.prompt,
      alpha: { from: 1, to: 0.3 },
      duration: 700,
      yoyo: true,
      repeat: -1,
      delay: 400,
    });
    this.prompt.setText('ENTER ▸');
  }

  private next() {
    this.prompt.setAlpha(0);
    this.tweens.killTweensOf(this.prompt);

    if (this.line >= PROLOGUE.length) {
      this.revealName();
      return;
    }
    this.typewriter.start(PROLOGUE[this.line++]);
  }

  /** Revelación del collar: NOVA-7, con el gato apareciendo desde la oscuridad. */
  private revealName() {
    this.input.keyboard!.removeAllListeners();
    this.text.setText('');
    this.prompt.setAlpha(0);

    const nova = this.add
      .sprite(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 26, `cat:${PLAYER_SPRITE}:idle`)
      .setScale(3)
      .setAlpha(0);
    nova.play(animKey(PLAYER_SPRITE, ANIM.idle));

    const name = neonLabel(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 24, 'NOVA-7', 'huge', '#3fe0d0')
      .setOrigin(0.5)
      .setAlpha(0);

    // Recordatorio de controles justo antes de empezar a jugar.
    const controles = label(
      this,
      GAME_WIDTH / 2,
      GAME_HEIGHT - 30,
      '← →  moverse       ESPACIO  saltar       E  interactuar       H  ayuda',
      'micro',
      '#6f8bd0',
    )
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({ targets: nova, alpha: 1, duration: 1400 });
    this.tweens.add({ targets: name, alpha: 1, duration: 1800, delay: 600 });
    this.tweens.add({ targets: controles, alpha: 1, duration: 1200, delay: 1800 });

    this.time.delayedCall(4200, () => this.finish());
    this.input.keyboard!.once('keydown-ENTER', () => this.finish());
  }

  private finish() {
    GameState.enterZone('z1');
    this.cameras.main.fadeOut(600, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(SCENES.game, { zone: 'z1' });
    });
  }
}

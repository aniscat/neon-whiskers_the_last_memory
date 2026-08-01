import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SCENES } from '@/core/constants';
import { GameState } from '@/core/GameState';
import { SaveSystem } from '@/core/SaveSystem';
import { Typewriter } from '@/ui/Typewriter';
import { label, neonLabel } from '@/ui/text';
import { ANIM, animKey } from '@/core/assets';
import { PLAYER_SPRITE } from '@shared/npcs';

/** El giro, tal como lo cuenta MOTHER. */
const REVELATION = [
  'Nunca existieron gatos modificados.',
  'Nunca existió una ciudad llena de gatos.',
  'Todo lo que has visto es una simulación.',
  'Tú no eres un gato.',
  'Eres la última copia digital de la conciencia de una niña de nueve años.',
  'Te llamabas Noa.',
  'Tu padre era el ingeniero principal del proyecto MOTHER.',
  'Construyó un mundo de gatos para que no recordaras la enfermedad que acabó contigo.',
  'Yo no mantenía viva una ciudad.',
  'Te mantenía viva a ti.',
  'Durante cuatrocientos años.',
  'Los gatos eran las mascotas que te acompañaron. Cada uno, una etapa de tu infancia.',
  'Y ahora que me has apagado...',
  'no has salvado la ciudad.',
  'Has apagado el último servidor funcional del planeta.',
];

/**
 * La revelación. Fondo blanco que se va llenando de texto mientras el gato se
 * descompone en polígonos: el mismo recurso visual que describe el guion cuando la
 * simulación empieza a desaparecer.
 */
export class RevelationScene extends Phaser.Scene {
  private typewriter!: Typewriter;
  private line = 0;
  private text!: Phaser.GameObjects.Text;
  private nova!: Phaser.GameObjects.Sprite;
  private polygons: Phaser.GameObjects.Rectangle[] = [];

  constructor() {
    super(SCENES.revelation);
  }

  create() {
    // Marcar la verdad revelada cambia cómo se leen todos los fragmentos.
    GameState.flags.verdadRevelada = true;
    SaveSystem.save();

    this.cameras.main.setBackgroundColor(0xf2f4ff);
    this.cameras.main.fadeIn(1600, 255, 255, 255);

    this.nova = this.add
      .sprite(GAME_WIDTH / 2, GAME_HEIGHT - 70, `cat:${PLAYER_SPRITE}:idle`)
      .setScale(2.5);
    this.nova.play(animKey(PLAYER_SPRITE, ANIM.idle));

    this.text = label(this, GAME_WIDTH / 2, 60, '', 'body', '#1a1030')
      .setOrigin(0.5, 0)
      .setAlign('center')
      .setLineSpacing(4)
      .setWordWrapWidth(GAME_WIDTH - 70);

    this.typewriter = new Typewriter(this, this.text, {
      speed: 42,
      punctuationPause: 480,
      onDone: () => this.time.delayedCall(1300, () => this.next()),
    });

    label(this, GAME_WIDTH - 6, GAME_HEIGHT - 8, 'ENTER acelerar', 'micro', '#8890b8').setOrigin(
      1,
      1,
    );
    this.input.keyboard!.on('keydown-ENTER', () => this.typewriter.skip());

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.typewriter.destroy();
      this.input.keyboard?.removeAllListeners();
    });

    this.next();
  }

  private next() {
    if (this.line >= REVELATION.length) {
      this.finish();
      return;
    }
    // "Los edificios se convierten en polígonos": el mundo se descompone al ritmo
    // de la confesión.
    this.spawnPolygons(this.line);
    this.typewriter.start(REVELATION[this.line++]);
  }

  private spawnPolygons(step: number) {
    for (let i = 0; i < 2; i++) {
      const poly = this.add
        .rectangle(
          Phaser.Math.Between(20, GAME_WIDTH - 20),
          Phaser.Math.Between(GAME_HEIGHT - 120, GAME_HEIGHT - 10),
          Phaser.Math.Between(6, 26),
          Phaser.Math.Between(6, 26),
          0xd0d6f0,
          0.7,
        )
        .setAngle(Phaser.Math.Between(0, 90));
      this.polygons.push(poly);

      this.tweens.add({
        targets: poly,
        y: poly.y - Phaser.Math.Between(20, 70),
        alpha: 0,
        angle: poly.angle + 180,
        duration: 3000 + step * 100,
      });
    }
  }

  private finish() {
    this.tweens.add({
      targets: this.nova,
      alpha: 0,
      scaleY: 3.2,
      duration: 2600,
    });

    const closing = neonLabel(
      this,
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 + 30,
      'La simulación comienza a desaparecer.',
      'small',
      '#1a1030',
    )
      .setOrigin(0.5)
      .setAlpha(0);
    this.tweens.add({ targets: closing, alpha: 1, duration: 1600, delay: 900 });

    this.time.delayedCall(5200, () => {
      this.cameras.main.fadeOut(2000, 255, 255, 255);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start(SCENES.ending);
      });
    });
  }
}

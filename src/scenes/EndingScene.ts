import Phaser from 'phaser';
import { applyRenderScale } from '@/core/renderScale';
import { GAME_HEIGHT, GAME_WIDTH, SCENES, RENDER_SCALE } from '@/core/constants';
import { RainSystem } from '@/world/art/RainSystem';
import { Typewriter } from '@/ui/Typewriter';
import { label } from '@/ui/text';
import { ANIM, animKey } from '@/core/assets';
import { CAT_VARIANTS, PLAYER_SPRITE } from '@shared/npcs';

const FINAL_MESSAGE =
  '"No todo lo que permanece vivo desea seguir existiendo. Pero todo aquello que fue amado merece ser recordado."';

type Beat = () => void;

/**
 * Final en cuatro movimientos, siguiendo el guion:
 *  1. Los gatos se reúnen alrededor de Nova y se desintegran, sin miedo.
 *  2. Pantalla blanca. Solo la lluvia.
 *  3. La Tierra silenciosa, con naturaleza sobre las ruinas, y un robot al 0%.
 *  4. Cinco segundos de negro y el mensaje final.
 */
export class EndingScene extends Phaser.Scene {
  private beats: Beat[] = [];
  private index = 0;

  constructor() {
    super(SCENES.ending);
  }

  create() {
    applyRenderScale(this);
    this.cameras.main.setBackgroundColor(0xffffff);
    this.beats = [
      () => this.gathering(),
      () => this.whiteout(),
      () => this.silentEarth(),
      () => this.lastMessage(),
    ];
    this.nextBeat();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.removeAllListeners();
    });
  }

  private nextBeat(delay = 0) {
    const beat = this.beats[this.index++];
    if (!beat) return;
    this.time.delayedCall(delay, beat);
  }

  /** "Todos los gatos se reúnen alrededor de Nova." */
  private gathering() {
    this.cameras.main.setBackgroundColor(0xf6f7ff);

    const nova = this.add
      .sprite(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, `cat:${PLAYER_SPRITE}:idle`)
      .setScale(2);
    nova.play(animKey(PLAYER_SPRITE, ANIM.idle));

    const others = CAT_VARIANTS.filter((v) => v !== PLAYER_SPRITE);
    const cats = others.map((variant, i) => {
      const angle = (i / others.length) * Math.PI * 2;
      const cat = this.add
        .sprite(
          GAME_WIDTH / 2 + Math.cos(angle) * 90,
          GAME_HEIGHT / 2 + 20 + Math.sin(angle) * 40,
          `cat:${variant}:idle`,
        )
        .setAlpha(0);
      cat.play(animKey(variant, ANIM.idle));
      cat.setFlipX(Math.cos(angle) > 0);

      this.tweens.add({ targets: cat, alpha: 1, duration: 900, delay: 200 + i * 260 });
      return cat;
    });

    const caption = label(
      this,
      GAME_WIDTH / 2,
      28,
      'Nadie tiene miedo.\nPorque todos sabían la verdad desde el principio.\nSolo Nova la había olvidado.',
      'small',
      '#1a1030',
    )
      .setOrigin(0.5, 0)
      .setAlign('center')
      .setLineSpacing(4 * RENDER_SCALE)
      .setAlpha(0);
    this.tweens.add({ targets: caption, alpha: 1, duration: 1400, delay: 2600 });

    // "Uno por uno empiezan a desintegrarse en pequeñas partículas luminosas."
    cats.forEach((cat, i) => {
      this.time.delayedCall(4200 + i * 420, () => this.disintegrate(cat));
    });
    this.time.delayedCall(4200 + cats.length * 420 + 600, () => this.disintegrate(nova));

    this.nextBeat(4200 + cats.length * 420 + 2200);
  }

  private disintegrate(target: Phaser.GameObjects.Sprite) {
    const key = 'fx:ending-dust';
    if (!this.textures.exists(key)) {
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0xffd76e, 1).fillRect(0, 0, 2, 2);
      g.generateTexture(key, 2, 2);
      g.destroy();
    }

    this.add
      .particles(target.x, target.y, key, {
        lifespan: 2200,
        speed: { min: 4, max: 22 },
        angle: { min: 250, max: 290 },
        scale: { start: 1.5, end: 0 },
        alpha: { start: 1, end: 0 },
        blendMode: Phaser.BlendModes.ADD,
        emitting: false,
      })
      .explode(40);

    this.tweens.add({ targets: target, alpha: 0, duration: 1500 });
  }

  /** "La pantalla queda completamente blanca. Se escucha únicamente la lluvia." */
  private whiteout() {
    this.cameras.main.fadeOut(1800, 255, 255, 255);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.children.removeAll();
      this.cameras.main.setBackgroundColor(0xffffff);
      this.cameras.main.fadeIn(600, 255, 255, 255);

      const rain = new RainSystem(this, 5);
      rain.setIntensity(0.5);

      this.nextBeat(4000);
    });
  }

  /** La Tierra sin ciudades, con naturaleza sobre las ruinas y el robot doméstico. */
  private silentEarth() {
    this.children.removeAll();
    this.cameras.main.setBackgroundColor(0x0a1410);

    // Ruinas y vegetación, dibujadas con rectángulos.
    const g = this.add.graphics();
    const rng = new Phaser.Math.RandomDataGenerator(['ending']);
    for (let x = 0; x < GAME_WIDTH; x += 14) {
      const h = rng.between(20, 90);
      g.fillStyle(0x16241c, 1).fillRect(x, GAME_HEIGHT - h, 12, h);
      // Hiedra que trepa por las ruinas.
      g.fillStyle(0x2f5a3a, 0.9);
      for (let y = GAME_HEIGHT - h; y < GAME_HEIGHT; y += 6) {
        if (rng.frac() < 0.6) g.fillRect(x + rng.between(0, 10), y, 2, 4);
      }
    }
    g.fillStyle(0x3f7a4a, 1).fillRect(0, GAME_HEIGHT - 12, GAME_WIDTH, 12);

    const caption = label(
      this,
      GAME_WIDTH / 2,
      20,
      'Sin ciudades iluminadas. Sin robots. Sin humanos.\nSolo naturaleza creciendo sobre las ruinas.',
      'micro',
      '#7fb08c',
    )
      .setOrigin(0.5, 0)
      .setAlign('center')
      .setLineSpacing(4 * RENDER_SCALE);

    // La cámara entra lentamente en el edificio destruido.
    // El zoom base ya es RENDER_SCALE; la cinem�tica se acerca a partir de ah�.
    this.cameras.main.setZoom(RENDER_SCALE);
    this.tweens.add({
      targets: this.cameras.main,
      zoom: RENDER_SCALE * 2.6,
      scrollX: 60,
      scrollY: 40,
      duration: 6000,
      ease: 'Sine.inOut',
    });
    this.tweens.add({ targets: caption, alpha: 0, duration: 1500, delay: 2500 });

    // El pequeño robot doméstico, con su batería al 0%.
    this.time.delayedCall(4200, () => {
      const robot = this.add.graphics().setScrollFactor(1);
      const rx = 150;
      const ry = GAME_HEIGHT - 40;
      robot.fillStyle(0x2a2f3a, 1).fillRoundedRect(rx, ry, 14, 12, 3);
      robot.fillStyle(0x121620, 1).fillRect(rx + 3, ry + 3, 8, 4);
      robot.fillStyle(0xff2f6d, 0.9).fillRect(rx + 4, ry + 4, 1, 2);

      const battery = label(this, rx + 7, ry - 8, '0%', 'micro', '#ff2f6d').setOrigin(0.5);
      this.tweens.add({
        targets: battery,
        alpha: { from: 1, to: 0.2 },
        duration: 700,
        yoyo: true,
        repeat: 3,
      });
    });

    this.nextBeat(8000);
  }

  /** "La pantalla se apaga. Cinco segundos de silencio." */
  private lastMessage() {
    this.cameras.main.fadeOut(1500, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.children.removeAll();
      this.cameras.main.setBackgroundColor(0x000000);
      this.cameras.main.resetFX();
      this.cameras.main.setZoom(RENDER_SCALE).setScroll(0, 0);

      // Cinco segundos exactos de negro, como pide el guion.
      this.time.delayedCall(5000, () => {
        const message = label(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, '', 'small', '#d7e3ff')
          .setOrigin(0.5)
          .setAlign('center')
          .setLineSpacing(5 * RENDER_SCALE)
          .setWordWrapWidth((GAME_WIDTH - 80) * RENDER_SCALE);

        const typewriter = new Typewriter(this, message, {
          speed: 46,
          punctuationPause: 400,
          onDone: () => {
            this.time.delayedCall(3200, () => this.scene.start(SCENES.credits));
          },
        });
        typewriter.start(FINAL_MESSAGE);
        this.input.keyboard!.once('keydown-ENTER', () => typewriter.skip());
      });
    });
  }
}

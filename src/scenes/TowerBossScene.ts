import Phaser from 'phaser';
import { applyRenderScale } from '@/core/renderScale';
import { GAME_HEIGHT, GAME_WIDTH, PALETTE, SCENES, RENDER_SCALE } from '@/core/constants';
import { GameState } from '@/core/GameState';
import { SaveSystem } from '@/core/SaveSystem';
import { EventBus } from '@/core/EventBus';
import { Player, type PlayerKeys } from '@/entities/Player';
import { buildLevel, type BuiltLevel } from '@/world/LevelBuilder';
import { GlitchOverlay } from '@/world/art/GlitchOverlay';
import { getZone } from '@/world/zones';
import { Meter } from '@/ui/Panel';
import { label } from '@/ui/text';

/** Las tres fases del núcleo, con sus frases y su patrón de ataque. */
const PHASES = [
  {
    hp: 3,
    line: 'Has llegado más lejos de lo que calculé, NOVA-7.',
    projectiles: 3,
    interval: 1400,
  },
  {
    hp: 3,
    line: 'Cada distrito que se apaga es un año que le quito a alguien.',
    projectiles: 4,
    interval: 1100,
  },
  {
    hp: 3,
    line: 'Si me apagas, no salvas la ciudad. Pero ya lo sabes, ¿verdad?',
    projectiles: 5,
    interval: 850,
  },
];

const TOTAL_HP = PHASES.reduce((sum, p) => sum + p.hp, 0);
const CORE_TEXTURE = 'boss:core';

/**
 * La Torre de la Memoria. Pelea contra el núcleo de MOTHER en tres fases: se le
 * daña saltando sobre él cuando baja, esquivando los proyectiles. Al vencerlo NO
 * se gana nada: se abre la escena de la revelación.
 */
export class TowerBossScene extends Phaser.Scene {
  private level!: BuiltLevel;
  private player!: Player;
  private core!: Phaser.Physics.Arcade.Sprite;
  private glitch!: GlitchOverlay;
  private hpMeter!: Meter;
  private lineText!: Phaser.GameObjects.Text;
  private hp = TOTAL_HP;
  private phase = 0;
  private vulnerable = false;
  private finished = false;
  private transitioning = false;
  private attackTimer?: Phaser.Time.TimerEvent;
  private projectiles!: Phaser.Physics.Arcade.Group;

  constructor() {
    super(SCENES.boss);
  }

  create() {
    applyRenderScale(this);
    GameState.enterZone('tower');
    const def = getZone('tower');

    this.cameras.main.setBackgroundColor(0x04040a);
    this.cameras.main.setBounds(0, 0, def.width, def.height);
    this.level = buildLevel(this, def);

    this.player = new Player(this, def.spawn.x, def.spawn.y);
    // La arena es más alta que la pantalla, así que la cámara sigue a Nova.
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.setupInput();
    this.physics.add.collider(this.player, this.level.solids);

    this.buildCore();
    this.projectiles = this.physics.add.group({ allowGravity: false });
    this.physics.add.overlap(this.player, this.projectiles, (_p, projectile) => {
      (projectile as Phaser.Physics.Arcade.Sprite).destroy();
      this.player.hurt(this.core.x);
    });

    this.glitch = new GlitchOverlay(this);
    this.glitch.setIntensity(0.75);

    // La cámara sigue a Nova, así que la interfaz tiene que ir fija a pantalla.
    label(this, GAME_WIDTH / 2, 8, 'NÚCLEO PRINCIPAL — MOTHER', 'micro', '#ff2f6d')
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(40);

    this.hpMeter = new Meter(this, GAME_WIDTH / 2 - 60, 18, 120, 4, PALETTE.neonPink);
    this.hpMeter.setValue(1);
    this.hpMeter.setScrollFactor(0).setDepth(40);

    label(this, GAME_WIDTH / 2, 26, 'SALTA SOBRE EL NÚCLEO CUANDO DESCIENDA', 'micro', '#a8b8e8')
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(40);

    this.lineText = label(this, GAME_WIDTH / 2, GAME_HEIGHT - 24, '', 'micro', '#d7e3ff')
      .setOrigin(0.5)
      .setWordWrapWidth((GAME_WIDTH - 40) * RENDER_SCALE)
      .setAlign('center')
      .setScrollFactor(0)
      .setDepth(40);

    // Hint de mecánica: desaparece sola en 5 segundos para no molestar.
    const mechHint = label(
      this,
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 - 10,
      '▼  SALTA ENCIMA DEL NÚCLEO CUANDO DESCIENDA  ▼',
      'micro',
      '#ffb347',
    )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(40)
      .setAlpha(0);

    this.tweens.add({
      targets: mechHint,
      alpha: { from: 0, to: 1 },
      duration: 600,
      onComplete: () => {
        this.time.delayedCall(4000, () => {
          this.tweens.add({ targets: mechHint, alpha: 0, duration: 800 });
        });
      },
    });

    this.startPhase(0);
    this.cameras.main.fadeIn(800, 0, 0, 0);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.glitch.destroy();
      this.level.painter.destroy();
      this.input.keyboard?.removeAllListeners();
    });
  }

  private setupInput() {
    const kb = this.input.keyboard!;
    const K = Phaser.Input.Keyboard.KeyCodes;
    const keys: PlayerKeys = {
      left: kb.addKey(K.LEFT),
      right: kb.addKey(K.RIGHT),
      up: kb.addKey(K.UP),
      down: kb.addKey(K.DOWN),
      jump: kb.addKey(K.SPACE),
      dash: kb.addKey(K.SHIFT),
      hack: kb.addKey(K.E),
      gravity: kb.addKey(K.Q),
      holo: kb.addKey(K.F),
      drone: kb.addKey(K.R),
    };
    this.player.bindKeys(keys);
    this.player.setHoloGroup(this.physics.add.staticGroup());

    // ESC: volver al menú principal.
    kb.on('keydown-ESC', () => {
      if (this.finished) return;
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start(SCENES.menu);
      });
    });

    // La salida de la Torre lleva a la escena de revelación una vez derrotado
    // MOTHER. Antes de la derrota el marcador de salida está ahí pero no hace nada.
    this.physics.add.overlap(this.player, this.level.exit, () => {
      if (!this.finished || this.transitioning) return;
      this.transitioning = true;
      this.cameras.main.fadeOut(800, 255, 255, 255);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start(SCENES.revelation);
      });
    });
  }

  /** El núcleo es un ojo de datos dibujado por código. */
  private buildCore() {
    if (!this.textures.exists(CORE_TEXTURE)) {
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0x1a0a1e, 1).fillCircle(20, 20, 20);
      g.lineStyle(2, PALETTE.neonPink, 0.9).strokeCircle(20, 20, 18);
      g.fillStyle(PALETTE.neonPink, 0.9).fillCircle(20, 20, 7);
      g.fillStyle(PALETTE.bone, 1).fillCircle(20, 20, 3);
      g.generateTexture(CORE_TEXTURE, 40, 40);
      g.destroy();
    }

    this.core = this.physics.add.sprite(GAME_WIDTH / 2, 90, CORE_TEXTURE);
    this.core.setDepth(18);
    (this.core.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.core.setCircle(18);

    // Saltarle encima cuando es vulnerable es la única forma de dañarlo.
    this.physics.add.overlap(this.player, this.core, () => {
      if (!this.vulnerable || this.finished) return;
      const desdeArriba = this.player.y < this.core.y - 8;
      if (!desdeArriba) {
        this.player.hurt(this.core.x);
        return;
      }
      this.damageCore();
    });

    this.tweens.add({
      targets: this.core,
      x: { from: 110, to: GAME_WIDTH - 110 },
      duration: 3200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });
  }

  private startPhase(index: number) {
    this.phase = index;
    const phase = PHASES[index];
    this.say(phase.line);

    this.attackTimer?.remove();
    this.attackTimer = this.time.addEvent({
      delay: phase.interval,
      loop: true,
      callback: () => this.attack(phase.projectiles),
    });

    // Baja periódicamente y se queda vulnerable un instante.
    this.time.addEvent({
      delay: 4200,
      loop: true,
      callback: () => this.descend(),
    });
  }

  private descend() {
    if (this.finished) return;
    this.vulnerable = true;
    this.core.setTint(0xffffff);
    this.tweens.add({
      targets: this.core,
      y: 210,
      duration: 700,
      yoyo: true,
      hold: 500,
      ease: 'Quad.inOut',
      onComplete: () => {
        this.vulnerable = false;
        this.core.clearTint();
      },
    });
  }

  private attack(count: number) {
    if (this.finished) return;
    const key = 'boss:shot';
    if (!this.textures.exists(key)) {
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(PALETTE.neonPink, 1).fillCircle(3, 3, 3);
      g.generateTexture(key, 6, 6);
      g.destroy();
    }

    for (let i = 0; i < count; i++) {
      const shot = this.projectiles.create(this.core.x, this.core.y + 16, key) as
        Phaser.Physics.Arcade.Sprite;
      shot.setBlendMode(Phaser.BlendModes.ADD).setDepth(17);
      const spread = (i - (count - 1) / 2) * 40;
      shot.setVelocity(spread, 150);
      this.time.delayedCall(4000, () => shot.destroy());
    }
  }

  private damageCore() {
    this.hp--;
    this.vulnerable = false;
    this.hpMeter.setValue(this.hp / TOTAL_HP);
    this.player.setVelocityY(-260);
    this.cameras.main.shake(180, 0.008);
    this.cameras.main.flash(120, 255, 47, 109);
    this.core.setTint(0xff2f6d);
    this.time.delayedCall(150, () => this.core.clearTint());

    if (this.hp <= 0) {
      this.defeat();
      return;
    }

    // Cambio de fase cuando se agota el bloque de vida correspondiente.
    const restanteEnFases = PHASES.slice(this.phase + 1).reduce((s, p) => s + p.hp, 0);
    if (this.hp <= restanteEnFases && this.phase < PHASES.length - 1) {
      this.startPhase(this.phase + 1);
    }
  }

  private say(text: string) {
    this.lineText.setText(text).setAlpha(0);
    this.tweens.add({ targets: this.lineText, alpha: 1, duration: 400 });
  }

  /** "Pero antes de destruirla... MOTHER le muestra toda la verdad." */
  private defeat() {
    this.finished = true;
    this.attackTimer?.remove();
    this.time.removeAllEvents();
    this.projectiles.clear(true, true);
    this.player.freeze(true);

    GameState.flags.nucleoDestruido = true;
    GameState.corrupcion = 1;
    SaveSystem.save();
    EventBus.emit('state:changed');

    this.say('Espera. Antes de apagarme, mira.');
    this.tweens.add({ targets: this.core, alpha: 0.2, scale: 1.6, duration: 2400 });

    // Descongelar a Nova tras la cinemática para que pueda caminar a la SALIDA.
    this.time.delayedCall(2600, () => {
      this.player.freeze(false);
      this.say('Ve a la SALIDA →');

      // Flecha de salida parpadeante en la esquina derecha: inamovible.
      const exitArrow = label(
        this,
        GAME_WIDTH - 10,
        GAME_HEIGHT / 2,
        '→ SALIDA',
        'small',
        '#3fe0d0',
      )
        .setOrigin(1, 0.5)
        .setScrollFactor(0)
        .setDepth(50);

      this.tweens.add({
        targets: exitArrow,
        alpha: { from: 0.3, to: 1 },
        duration: 500,
        yoyo: true,
        repeat: -1,
      });
    });
  }
}

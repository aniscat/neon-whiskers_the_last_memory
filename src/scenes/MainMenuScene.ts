import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SCENES } from '@/core/constants';
import { NeonCityBackground } from '@/world/art/NeonCityBackground';
import { RainSystem } from '@/world/art/RainSystem';
import { GameState } from '@/core/GameState';
import { SaveSystem } from '@/core/SaveSystem';
import { ANIM, animKey } from '@/core/assets';
import { PLAYER_SPRITE } from '@shared/npcs';
import { ZONES } from '@shared/lore';

interface MenuOption {
  label: string;
  enabled: boolean;
  action: () => void;
}

export class MainMenuScene extends Phaser.Scene {
  private background!: NeonCityBackground;
  private options: MenuOption[] = [];
  private labels: Phaser.GameObjects.Text[] = [];
  private cursor = 0;

  constructor() {
    super(SCENES.menu);
  }

  create() {
    this.background = new NeonCityBackground(this, 'menu');
    new RainSystem(this).setIntensity(0.75);

    this.add
      .text(GAME_WIDTH / 2, 54, 'NEON WHISKERS', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#3fe0d0',
      })
      .setOrigin(0.5)
      .setShadow(0, 0, '#3fe0d0', 8, true, true);

    this.add
      .text(GAME_WIDTH / 2, 74, 'THE LAST MEMORY', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#ff2f6d',
      })
      .setOrigin(0.5);

    // Nova se pasea por el suelo del menú.
    const nova = this.add
      .sprite(GAME_WIDTH / 2 - 70, GAME_HEIGHT - 34, `cat:${PLAYER_SPRITE}:idle`)
      .setScale(1.5);
    nova.play(animKey(PLAYER_SPRITE, ANIM.run));
    this.tweens.add({
      targets: nova,
      x: GAME_WIDTH / 2 + 70,
      duration: 5000,
      yoyo: true,
      repeat: -1,
      onYoyo: () => nova.setFlipX(true),
      onRepeat: () => nova.setFlipX(false),
    });

    this.buildOptions();
    this.bindInput();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.removeAllListeners();
      this.background.destroy();
    });
  }

  private buildOptions() {
    const save = SaveSystem.read();
    this.options = [
      {
        label: 'NUEVA PARTIDA',
        enabled: true,
        action: () => {
          GameState.reset();
          SaveSystem.clear();
          this.scene.start(SCENES.intro);
        },
      },
      {
        label: save ? `CONTINUAR — ${ZONES[save.zona].nombre}` : 'CONTINUAR',
        enabled: Boolean(save),
        action: () => {
          if (!SaveSystem.load()) return;
          this.scene.start(SCENES.game, { zone: GameState.zona });
        },
      },
      {
        label: 'CÓMO JUGAR',
        enabled: true,
        action: () => this.scene.start(SCENES.howToPlay),
      },
      {
        label: 'CRÉDITOS',
        enabled: true,
        action: () => this.scene.start(SCENES.credits, { fromMenu: true }),
      },
    ];

    this.labels = this.options.map((opt, i) =>
      this.add
        .text(GAME_WIDTH / 2, 122 + i * 16, opt.label, {
          fontFamily: 'monospace',
          fontSize: '9px',
          color: '#d7e3ff',
        })
        .setOrigin(0.5),
    );

    // Si hay partida guardada, empezar el cursor en Continuar.
    this.cursor = this.options[1].enabled ? 1 : 0;
    this.refresh();
  }

  private refresh() {
    this.labels.forEach((label, i) => {
      const opt = this.options[i];
      const selected = i === this.cursor;
      label.setColor(!opt.enabled ? '#3a4770' : selected ? '#ffb347' : '#d7e3ff');
      label.setText(`${selected && opt.enabled ? '> ' : '  '}${opt.label}`);
    });
  }

  private move(delta: number) {
    const total = this.options.length;
    for (let i = 1; i <= total; i++) {
      const next = (this.cursor + delta * i + total * total) % total;
      if (this.options[next].enabled) {
        this.cursor = next;
        break;
      }
    }
    this.refresh();
  }

  private bindInput() {
    const kb = this.input.keyboard!;
    kb.on('keydown-UP', () => this.move(-1));
    kb.on('keydown-DOWN', () => this.move(1));
    kb.on('keydown-W', () => this.move(-1));
    kb.on('keydown-S', () => this.move(1));

    const confirm = () => {
      const opt = this.options[this.cursor];
      if (opt.enabled) opt.action();
    };
    kb.on('keydown-ENTER', confirm);
    kb.on('keydown-SPACE', confirm);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 12, '↑↓ elegir   ENTER confirmar', {
        fontFamily: 'monospace',
        fontSize: '6px',
        color: '#6f8bd0',
      })
      .setOrigin(0.5);
  }

  override update() {
    this.background.update(this.time.now * 0.006, 0);
  }
}

import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, PALETTE, SCENES } from '@/core/constants';
import { GameState } from '@/core/GameState';
import { EventBus } from '@/core/EventBus';
import { ABILITIES, ABILITY_ORDER } from '@/abilities';
import { MEMORY_FRAGMENTS, ZONES, getFragment } from '@shared/lore';
import { Meter } from '@/ui/Panel';
import { hex, label } from '@/ui/text';
import type { AbilityId } from '@shared/types';

/**
 * HUD superpuesto: zona actual, habilidades desbloqueadas, contador de fragmentos,
 * medidor de corrupción y una cola de avisos. Vive en su propia escena para que
 * no se vea afectado por la cámara ni por los glitches del mundo.
 */
export class HUDScene extends Phaser.Scene {
  private zoneLabel!: Phaser.GameObjects.Text;
  private fragmentLabel!: Phaser.GameObjects.Text;
  private corruption!: Meter;
  private abilityIcons = new Map<AbilityId, Phaser.GameObjects.Text>();
  private toasts: Phaser.GameObjects.Text[] = [];

  constructor() {
    super({ key: SCENES.hud, active: false });
  }

  create() {
    this.zoneLabel = label(this, 6, 5, '', 'micro', '#3fe0d0');
    this.fragmentLabel = label(this, 6, 14, '', 'micro', '#8b5cff');

    label(this, GAME_WIDTH - 6, 5, 'CORRUPCIÓN', 'micro', '#6f8bd0').setOrigin(1, 0);
    this.corruption = new Meter(this, GAME_WIDTH - 62, 14, 56, 4, PALETTE.neonPink);

    this.buildAbilityBar();
    this.refresh();
    this.bindEvents();
  }

  /** Fila de iconos: apagados si la habilidad todavía no se tiene. */
  private buildAbilityBar() {
    ABILITY_ORDER.forEach((id, i) => {
      const spec = ABILITIES[id];
      const icon = label(this, 6 + i * 14, GAME_HEIGHT - 12, spec.glifo, 'small', '#2a3358');
      this.abilityIcons.set(id, icon);
    });
  }

  private bindEvents() {
    const refresh = () => this.refresh();
    const onToast = (text: string) => this.toast(text);
    const onAbility = (id: AbilityId) => this.announceAbility(id);
    const onFragment = (id: string) =>
      this.toast(`FRAGMENTO: ${getFragment(id)?.titulo ?? id}`);
    const onDeath = () => this.toast('REINICIANDO SECTOR');
    const onHint = (text: string) => this.toast(`PISTA: ${text}`, 5200);

    EventBus.on('state:changed', refresh);
    EventBus.on('corruption:changed', refresh);
    EventBus.on('toast', onToast);
    EventBus.on('ability:granted', onAbility);
    EventBus.on('fragment:collected', onFragment);
    EventBus.on('player:died', onDeath);
    EventBus.on('hint:shown', onHint);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      EventBus.off('state:changed', refresh);
      EventBus.off('corruption:changed', refresh);
      EventBus.off('toast', onToast);
      EventBus.off('ability:granted', onAbility);
      EventBus.off('fragment:collected', onFragment);
      EventBus.off('player:died', onDeath);
      EventBus.off('hint:shown', onHint);
    });
  }

  private refresh() {
    this.zoneLabel.setText(ZONES[GameState.zona].nombre.toUpperCase());
    this.fragmentLabel.setText(
      `MEMORIA ${GameState.fragmentos.size}/${MEMORY_FRAGMENTS.length}`,
    );
    this.corruption.setValue(GameState.corrupcion);

    for (const [id, icon] of this.abilityIcons) {
      icon.setColor(GameState.has(id) ? hex(ABILITIES[id].color) : '#2a3358');
    }
  }

  /** Aviso grande y centrado cuando se desbloquea una habilidad. */
  private announceAbility(id: AbilityId) {
    const spec = ABILITIES[id];
    const title = label(
      this,
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 - 10,
      `NUEVA HABILIDAD — ${spec.nombre.toUpperCase()}`,
      'body',
      hex(spec.color),
    )
      .setOrigin(0.5)
      .setShadow(0, 0, hex(spec.color), 8, true, true);

    const detail = label(
      this,
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 + 4,
      `${spec.descripcion}   [${spec.tecla}]`,
      'micro',
      '#d7e3ff',
    ).setOrigin(0.5);

    this.tweens.add({
      targets: [title, detail],
      alpha: { from: 0, to: 1 },
      duration: 300,
      hold: 2400,
      yoyo: true,
      onComplete: () => {
        title.destroy();
        detail.destroy();
      },
    });
  }

  /** Cola de avisos: los nuevos empujan los antiguos hacia arriba. */
  private toast(text: string, duration = 2600) {
    const entry = label(this, GAME_WIDTH / 2, GAME_HEIGHT - 32, text, 'micro', '#ffb347')
      .setOrigin(0.5)
      .setAlpha(0);

    this.toasts.push(entry);
    this.toasts.forEach((t, i) => {
      const targetY = GAME_HEIGHT - 32 - (this.toasts.length - 1 - i) * 9;
      this.tweens.add({ targets: t, y: targetY, duration: 160 });
    });

    this.tweens.add({ targets: entry, alpha: 1, duration: 180 });
    this.time.delayedCall(duration, () => {
      this.tweens.add({
        targets: entry,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          this.toasts = this.toasts.filter((t) => t !== entry);
          entry.destroy();
        },
      });
    });
  }
}

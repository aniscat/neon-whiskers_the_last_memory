import Phaser from 'phaser';
import { PALETTE } from '@/core/constants';
import { GameState } from '@/core/GameState';
import { EventBus } from '@/core/EventBus';
import { label } from '@/ui/text';
import type { DoorDef } from '@/world/ZoneDefinition';

const WIDTH = 10;

/**
 * Puerta bloqueada. Se abre con la habilidad `hack` (pulsando E al lado) o al
 * resolver el acertijo de la zona, según `opensWith`.
 */
export class HackDoor extends Phaser.Physics.Arcade.Sprite {
  readonly doorId: string;
  readonly opensWith: DoorDef['opensWith'];
  private open = false;
  private readonly cue: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, def: DoorDef) {
    HackDoor.ensureTexture(scene, def.h);
    super(scene, def.x, def.y, `door:${def.h}`);
    this.doorId = def.id;
    this.opensWith = def.opensWith;

    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.setOrigin(0.5, 0).setDepth(14);

    this.cue = label(
      scene,
      def.x,
      def.y - 10,
      def.opensWith === 'hack' ? '[E] hackear' : 'SELLADA',
      'micro',
      '#ffb347',
    )
      .setOrigin(0.5)
      .setDepth(19)
      .setVisible(false);
  }

  private static ensureTexture(scene: Phaser.Scene, height: number) {
    const key = `door:${height}`;
    if (scene.textures.exists(key)) return;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x101736, 1).fillRect(0, 0, WIDTH, height);
    g.lineStyle(1, PALETTE.neonAmber, 0.8).strokeRect(0.5, 0.5, WIDTH - 1, height - 1);
    // Barras de cierre.
    g.fillStyle(PALETTE.neonAmber, 0.35);
    for (let y = 3; y < height - 2; y += 6) g.fillRect(1, y, WIDTH - 2, 2);
    g.generateTexture(key, WIDTH, height);
    g.destroy();
  }

  setNearby(nearby: boolean) {
    if (this.open) return;
    this.cue.setVisible(nearby);
  }

  get isOpen() {
    return this.open;
  }

  /** Devuelve false si al jugador aún le falta la habilidad o el acertijo. */
  tryOpen(): boolean {
    if (this.open) return true;

    if (this.opensWith === 'hack' && !GameState.has('hack')) {
      EventBus.emit('toast', 'La cerradura no responde. Falta algo en el collar.');
      return false;
    }
    if (this.opensWith === 'puzzle' && !GameState.flags.acertijosResueltos.includes(GameState.zona)) {
      EventBus.emit('toast', 'Sellada desde dentro.');
      return false;
    }

    this.open = true;
    this.cue.setVisible(false);
    (this.body as Phaser.Physics.Arcade.StaticBody).enable = false;

    this.scene.tweens.add({
      targets: this,
      scaleY: 0.05,
      alpha: 0.25,
      duration: 420,
      ease: 'Quad.in',
    });
    EventBus.emit('toast', 'ACCESO CONCEDIDO');
    return true;
  }

  override destroy(fromScene?: boolean) {
    this.cue.destroy();
    super.destroy(fromScene);
  }
}

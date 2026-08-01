import Phaser from 'phaser';
import { PALETTE } from '@/core/constants';
import { getFragment } from '@shared/lore';

const TEXTURE = 'fx:fragment';

/**
 * Fragmento de memoria recogible. Visualmente es un rombo de datos flotando; al
 * principio Nova los lee como recuerdos humanos y solo después descubre que son
 * suyos, así que el objeto es deliberadamente frío y anónimo.
 */
export class MemoryFragmentPickup extends Phaser.Physics.Arcade.Sprite {
  readonly fragmentId: string;

  constructor(scene: Phaser.Scene, x: number, y: number, fragmentId: string) {
    MemoryFragmentPickup.ensureTexture(scene);
    super(scene, x, y, TEXTURE);
    this.fragmentId = fragmentId;

    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.setDepth(15).setBlendMode(Phaser.BlendModes.ADD);

    scene.tweens.add({
      targets: this,
      y: y - 4,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });
    scene.tweens.add({
      targets: this,
      angle: 360,
      duration: 6000,
      repeat: -1,
    });
  }

  private static ensureTexture(scene: Phaser.Scene) {
    if (scene.textures.exists(TEXTURE)) return;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    // Rombo con núcleo brillante.
    g.fillStyle(PALETTE.neonCyan, 0.35);
    g.fillTriangle(6, 0, 12, 6, 0, 6);
    g.fillTriangle(6, 12, 12, 6, 0, 6);
    g.fillStyle(PALETTE.bone, 0.95);
    g.fillRect(5, 5, 2, 2);
    g.generateTexture(TEXTURE, 12, 12);
    g.destroy();
  }

  get titulo() {
    return getFragment(this.fragmentId)?.titulo ?? 'Fragmento corrupto';
  }

  /** Absorción hacia el jugador antes de abrir el visor. */
  absorb(towards: Phaser.GameObjects.Sprite, onComplete: () => void) {
    (this.body as Phaser.Physics.Arcade.StaticBody).enable = false;
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({
      targets: this,
      x: towards.x,
      y: towards.y,
      scale: 0.2,
      alpha: 0,
      duration: 260,
      onComplete: () => {
        onComplete();
        this.destroy();
      },
    });
  }
}

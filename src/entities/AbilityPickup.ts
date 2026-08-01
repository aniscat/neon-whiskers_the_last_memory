import Phaser from 'phaser';
import { ABILITIES } from '@/abilities';
import { label } from '@/ui/text';
import type { AbilityId } from '@shared/types';

/**
 * Módulo de habilidad. Cada zona deja uno: es la recompensa de haber llegado al
 * final y lo que abre el diseño del nivel siguiente.
 */
export class AbilityPickup extends Phaser.GameObjects.Container {
  readonly ability: AbilityId;

  constructor(scene: Phaser.Scene, x: number, y: number, ability: AbilityId) {
    super(scene, x, y);
    this.ability = ability;
    const spec = ABILITIES[ability];

    const halo = scene.add
      .circle(0, 0, 10, spec.color, 0.22)
      .setBlendMode(Phaser.BlendModes.ADD);
    const core = scene.add
      .rectangle(0, 0, 8, 8, spec.color, 0.9)
      .setAngle(45)
      .setBlendMode(Phaser.BlendModes.ADD);
    const glyph = label(scene, 0, -1, spec.glifo, 'small', '#05060d').setOrigin(0.5);

    this.add([halo, core, glyph]);
    this.setDepth(15);
    scene.add.existing(this);

    // El contenedor necesita tamaño explícito para tener cuerpo de física.
    this.setSize(20, 20);
    scene.physics.add.existing(this, true);

    scene.tweens.add({
      targets: halo,
      scale: { from: 0.8, to: 1.35 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });
    scene.tweens.add({ targets: core, angle: 405, duration: 4000, repeat: -1 });
    scene.tweens.add({
      targets: this,
      y: y - 5,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });
  }

  /** Absorción hacia Nova antes de mostrar el aviso de desbloqueo. */
  absorb(towards: Phaser.GameObjects.Sprite, onComplete: () => void) {
    (this.body as Phaser.Physics.Arcade.StaticBody).enable = false;
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({
      targets: this,
      x: towards.x,
      y: towards.y,
      scale: 0.1,
      duration: 300,
      onComplete: () => {
        onComplete();
        this.destroy();
      },
    });
  }
}

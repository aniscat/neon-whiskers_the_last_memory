import Phaser from 'phaser';
import { PALETTE } from '@/core/constants';
import type { HazardDef } from './ZoneDefinition';

const COLORS: Record<HazardDef['kind'], number> = {
  water: 0x0a2a3a,
  laser: PALETTE.neonPink,
  spike: 0x3a1024,
  press: 0x2b1a3a,
};

/**
 * Peligro del entorno. Los que tienen `cycle` se encienden y apagan (láseres,
 * prensas hidráulicas del acertijo de la zona 1); el resto son letales siempre.
 */
export class Hazard extends Phaser.GameObjects.Rectangle {
  readonly kind: HazardDef['kind'];
  private readonly cycle: number;
  private readonly phase: number;

  constructor(scene: Phaser.Scene, def: HazardDef) {
    super(scene, def.x + def.w / 2, def.y + def.h / 2, def.w, def.h, COLORS[def.kind], 0.7);
    this.kind = def.kind;
    this.cycle = def.cycle ?? 0;
    this.phase = def.phase ?? 0;

    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.setDepth(-3).setBlendMode(
      def.kind === 'water' ? Phaser.BlendModes.NORMAL : Phaser.BlendModes.ADD,
    );

    if (def.kind === 'spike') this.drawSpikes(scene, def);
  }

  /** Los pinchos necesitan silueta propia para leerse como amenaza. */
  private drawSpikes(scene: Phaser.Scene, def: HazardDef) {
    const g = scene.add.graphics().setDepth(-3);
    g.fillStyle(PALETTE.neonPink, 0.85);
    for (let x = def.x; x < def.x + def.w; x += 4) {
      g.fillTriangle(x, def.y + def.h, x + 2, def.y, x + 4, def.y + def.h);
    }
    this.setAlpha(0);
  }

  /** true si en este instante el peligro está activo. */
  isLethalAt(time: number) {
    if (this.cycle <= 0) return true;
    return ((time + this.phase) % this.cycle) / this.cycle < 0.55;
  }

  /** Sincroniza cuerpo y opacidad con el ciclo. Lo llama `GameScene.update`. */
  refresh(time: number) {
    if (this.cycle <= 0) return;
    const lethal = this.isLethalAt(time);
    this.setAlpha(lethal ? 0.7 : 0.12);
    (this.body as Phaser.Physics.Arcade.StaticBody).enable = lethal;
  }

  get isEnabled() {
    return (this.body as Phaser.Physics.Arcade.StaticBody).enable;
  }
}

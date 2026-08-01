import Phaser from 'phaser';
import type { PlatformDef } from './ZoneDefinition';

/**
 * Plataforma móvil. Se mueve con velocidad (no con tweens) porque Arcade Physics
 * solo mantiene el cuerpo sincronizado si es la física la que lo desplaza.
 *
 * Además, Arcade no arrastra a los cuerpos apoyados encima, así que exponemos el
 * desplazamiento del frame y `GameScene` se lo suma al jugador cuando va montado.
 */
export class MovingPlatform extends Phaser.Physics.Arcade.Sprite {
  deltaX = 0;
  deltaY = 0;

  private readonly from: Phaser.Math.Vector2;
  private readonly to: Phaser.Math.Vector2;
  private readonly speed: number;
  private towardsTo = true;
  private prevX: number;
  private prevY: number;

  constructor(scene: Phaser.Scene, def: PlatformDef, textureKey: string) {
    super(scene, def.x + def.w / 2, def.y + def.h / 2, textureKey);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(-5);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    body.setSize(def.w, def.h);

    const move = def.move!;
    this.from = new Phaser.Math.Vector2(this.x, this.y);
    this.to = new Phaser.Math.Vector2(this.x + (move.dx ?? 0), this.y + (move.dy ?? 0));
    // `duration` es el tiempo de un trayecto completo de ida.
    this.speed = (this.from.distance(this.to) / move.duration) * 1000;

    this.prevX = this.x;
    this.prevY = this.y;
    this.aim();
  }

  private aim() {
    const target = this.towardsTo ? this.to : this.from;
    this.scene.physics.moveTo(this, target.x, target.y, this.speed);
  }

  protected override preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);

    this.deltaX = this.x - this.prevX;
    this.deltaY = this.y - this.prevY;
    this.prevX = this.x;
    this.prevY = this.y;

    const target = this.towardsTo ? this.to : this.from;
    // Al llegar (con margen para no oscilar), fija la posición y da la vuelta.
    if (Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y) < 2) {
      this.setPosition(target.x, target.y);
      this.towardsTo = !this.towardsTo;
      this.aim();
    }
  }
}

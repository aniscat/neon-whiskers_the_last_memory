import Phaser from 'phaser';
import { PALETTE } from '@/core/constants';
import { GameState } from '@/core/GameState';
import type { EnemyDef } from '@/world/ZoneDefinition';

/**
 * Enemigos dibujados por código (no hay assets de robots en los packs):
 *  - `drone`: flota y patrulla en horizontal con un ojo que barre.
 *  - `sentinel`: torreta fija que gira su haz.
 *  - `gang`: gato de pandilla que camina por el suelo.
 *
 * Cuando la corrupción es alta dejan de perseguir y solo observan, como dice el
 * guion: "los enemigos dejan de atacar y simplemente observan".
 */
export class Enemy extends Phaser.Physics.Arcade.Sprite {
  readonly kind: EnemyDef['kind'];
  private readonly origin: number;
  private readonly patrol: number;
  private readonly speed: number;
  private readonly eye: Phaser.GameObjects.Arc;
  private direction: 1 | -1 = 1;

  constructor(scene: Phaser.Scene, def: EnemyDef) {
    Enemy.ensureTexture(scene, def.kind);
    super(scene, def.x, def.y, `enemy:${def.kind}`);
    this.kind = def.kind;
    this.origin = def.x;
    this.patrol = def.patrol ?? 60;
    this.speed = def.speed ?? (def.kind === 'gang' ? 45 : 60);

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(16);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(def.kind === 'gang');
    if (def.kind === 'gang') body.setSize(12, 14);

    this.eye = scene.add
      .circle(def.x, def.y, 2, PALETTE.neonPink, 0.95)
      .setDepth(17)
      .setBlendMode(Phaser.BlendModes.ADD);
  }

  /** Genera la silueta del enemigo una sola vez por tipo. */
  private static ensureTexture(scene: Phaser.Scene, kind: EnemyDef['kind']) {
    const key = `enemy:${kind}`;
    if (scene.textures.exists(key)) return;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);

    if (kind === 'drone') {
      g.fillStyle(0x1a2244, 1).fillEllipse(10, 8, 20, 12);
      g.fillStyle(0x2f3f7a, 1).fillRect(0, 7, 20, 2);
      g.fillStyle(PALETTE.neonPink, 0.8).fillRect(8, 3, 4, 1);
      g.generateTexture(key, 20, 16);
    } else if (kind === 'sentinel') {
      g.fillStyle(0x141a33, 1).fillRect(2, 6, 12, 12);
      g.fillStyle(0x2b3a6b, 1).fillRect(0, 16, 16, 4);
      g.fillStyle(PALETTE.neonAmber, 0.8).fillRect(5, 9, 6, 2);
      g.generateTexture(key, 16, 20);
    } else {
      // Gato de pandilla: silueta felina con implante en la cabeza.
      g.fillStyle(0x241030, 1).fillEllipse(9, 11, 18, 10);
      g.fillStyle(0x241030, 1).fillRect(12, 2, 6, 7);
      g.fillStyle(PALETTE.neonPink, 0.9).fillRect(14, 4, 3, 1);
      g.fillStyle(0x241030, 1).fillRect(1, 6, 4, 4);
      g.generateTexture(key, 20, 18);
    }
    g.destroy();
  }

  /** Con la simulación degradada los enemigos se limitan a mirar. */
  private get passive() {
    return GameState.corrupcion > 0.6;
  }

  protected override preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
    this.eye.setPosition(this.x + this.direction * 4, this.y - 2);

    if (this.passive) {
      this.setVelocityX(0);
      this.eye.setFillStyle(PALETTE.bone, 0.9);
      this.setAlpha(0.55);
      return;
    }

    if (this.kind === 'sentinel') {
      // Solo gira: el haz se dibuja en GameScene a partir de este ángulo.
      this.setAngle(Math.sin(time / 900) * 22);
      return;
    }

    if (this.x > this.origin + this.patrol) this.direction = -1;
    if (this.x < this.origin - this.patrol) this.direction = 1;
    this.setVelocityX(this.direction * this.speed);
    this.setFlipX(this.direction === -1);

    if (this.kind === 'drone') {
      // Flotación senoidal: el dron nunca toca el suelo.
      this.y += Math.sin(time / 320) * 0.35;
    }
  }

  override destroy(fromScene?: boolean) {
    this.eye.destroy();
    super.destroy(fromScene);
  }
}

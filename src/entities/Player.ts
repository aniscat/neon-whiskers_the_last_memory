import Phaser from 'phaser';
import { CAT_FRAME, PALETTE } from '@/core/constants';
import { GRAVITY, JUMP_VELOCITY, RUN_SPEED } from '@/core/physics';
import { ANIM, animKey } from '@/core/assets';
import { GameState } from '@/core/GameState';
import { EventBus } from '@/core/EventBus';
import { PLAYER_SPRITE } from '@shared/npcs';

export type PlayerStateName =
  | 'idle'
  | 'run'
  | 'rise'
  | 'fall'
  | 'dash'
  | 'climb'
  | 'hurt'
  | 'frozen'
  | 'dissolving';

// Los valores viven en `core/physics.ts` porque los tests de geometría los usan
// para comprobar que cada plataforma de cada zona es alcanzable.
const SPEED = RUN_SPEED;
const DASH_SPEED = 300;
const DASH_MS = 150;
const DASH_COOLDOWN_MS = 420;
const CLIMB_SPEED = 70;
const COYOTE_MS = 90;
const JUMP_BUFFER_MS = 110;
const HURT_MS = 450;
/** Gracia extra tras el golpe, ya recuperado el control. */
const INVULNERABLE_MS = 700;
const HOLO_LIFETIME_MS = 2600;

export interface PlayerKeys {
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  jump: Phaser.Input.Keyboard.Key;
  dash: Phaser.Input.Keyboard.Key;
  hack: Phaser.Input.Keyboard.Key;
  gravity: Phaser.Input.Keyboard.Key;
  holo: Phaser.Input.Keyboard.Key;
  drone: Phaser.Input.Keyboard.Key;
}

/**
 * NOVA-7. Máquina de estados sobre Arcade Physics.
 *
 * Las siete habilidades del guion se activan aquí consultando `GameState`, así
 * que basta con otorgar la habilidad para que el movimiento cambie. Como los
 * packs solo traen `idle` y `jump`, la expresividad se consigue combinando esas
 * animaciones con escalado, rotación y estelas.
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
  state: PlayerStateName = 'idle';
  facing: 1 | -1 = 1;
  /** true cuando la gravedad está invertida (habilidad `gravityFlip`). */
  flipped = false;

  private jumpsUsed = 0;
  private lastGroundedAt = -Infinity;
  private jumpPressedAt = -Infinity;
  private dashEndsAt = 0;
  private dashReadyAt = 0;
  private hurtUntil = 0;
  private graceUntil = 0;
  private touchingWall: -1 | 0 | 1 = 0;
  private trail?: Phaser.GameObjects.Particles.ParticleEmitter;
  private keys!: PlayerKeys;
  private holoGroup?: Phaser.Physics.Arcade.StaticGroup;
  private holoUsedAt = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, `cat:${PLAYER_SPRITE}:idle`);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(20);
    // El sprite es 32x32 pero el gato ocupa mucho menos: cuerpo ajustado.
    this.setSize(14, 14).setOffset((CAT_FRAME - 14) / 2, CAT_FRAME - 16);
    this.arcadeBody.gravity.y = 0;
    this.setMaxVelocity(DASH_SPEED, 620);
    // Choca con los lados y el techo. El borde inferior se desactiva a nivel de
    // mundo en `LevelBuilder` (setBoundsCollision), para que caerse sea posible.
    this.setCollideWorldBounds(true);
    this.play(animKey(PLAYER_SPRITE, ANIM.idle));

    this.buildTrail();
  }

  bindKeys(keys: PlayerKeys) {
    this.keys = keys;
  }

  /** Grupo donde se insertan las plataformas holográficas que crea el jugador. */
  setHoloGroup(group: Phaser.Physics.Arcade.StaticGroup) {
    this.holoGroup = group;
  }

  private buildTrail() {
    const key = 'fx:trail';
    if (!this.scene.textures.exists(key)) {
      const g = this.scene.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(PALETTE.neonCyan, 1).fillRect(0, 0, 2, 2);
      g.generateTexture(key, 2, 2);
      g.destroy();
    }
    this.trail = this.scene.add
      .particles(0, 0, key, {
        lifespan: 260,
        speed: 0,
        scale: { start: 1.4, end: 0 },
        alpha: { start: 0.7, end: 0 },
        blendMode: Phaser.BlendModes.ADD,
        emitting: false,
      })
      .setDepth(19);
  }

  /** Atajo tipado: `this.body` es `Body | StaticBody | null` para Phaser. */
  private get arcadeBody() {
    return this.body as Phaser.Physics.Arcade.Body;
  }

  get onGround() {
    const { blocked } = this.arcadeBody;
    return this.flipped ? blocked.up : blocked.down;
  }

  get isBusy() {
    return this.state === 'frozen' || this.state === 'dissolving';
  }

  /** Congela el control durante los diálogos y las cinemáticas. */
  freeze(frozen: boolean) {
    this.state = frozen ? 'frozen' : 'idle';
    this.setVelocity(0, this.arcadeBody.velocity.y);
    if (frozen) this.play(animKey(PLAYER_SPRITE, ANIM.idle), true);
  }

  /** Registra contacto con una pared escalable; lo llama GameScene por overlap. */
  setWallContact(side: -1 | 0 | 1) {
    this.touchingWall = side;
  }

  protected override preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
    if (this.isBusy) return;

    const body = this.arcadeBody;
    body.gravity.y = this.flipped ? -GRAVITY * 2 : GRAVITY;
    this.setFlipY(this.flipped);

    if (this.onGround) {
      this.lastGroundedAt = time;
      this.jumpsUsed = 0;
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.jump)) this.jumpPressedAt = time;

    if (time < this.hurtUntil) {
      this.state = 'hurt';
      this.applyAnimation();
      return;
    }

    if (this.state === 'dash') {
      if (time < this.dashEndsAt) {
        this.trail?.emitParticleAt(this.x, this.y + 6);
        return;
      }
      this.setVelocityX(this.facing * SPEED);
      this.state = 'fall';
    }

    this.handleAbilities(time);

    if (this.tryClimb(time)) return;

    this.handleHorizontal();
    this.handleJump(time);
    this.resolveState();
    this.applyAnimation();
  }

  private handleHorizontal() {
    const left = this.keys.left.isDown;
    const right = this.keys.right.isDown;

    if (left === right) {
      this.setVelocityX(0);
      return;
    }
    this.facing = right ? 1 : -1;
    this.setVelocityX(this.facing * SPEED);
    this.setFlipX(this.facing === -1);
  }

  private handleJump(time: number) {
    const buffered = time - this.jumpPressedAt < JUMP_BUFFER_MS;
    if (!buffered) return;

    const coyote = time - this.lastGroundedAt < COYOTE_MS;
    const maxJumps = GameState.has('doubleJump') ? 2 : 1;

    const canFirst = (this.onGround || coyote) && this.jumpsUsed === 0;
    const canExtra = !this.onGround && this.jumpsUsed > 0 && this.jumpsUsed < maxJumps;
    if (!canFirst && !canExtra) return;

    this.jumpPressedAt = -Infinity;
    this.jumpsUsed++;
    this.setVelocityY(this.flipped ? JUMP_VELOCITY : -JUMP_VELOCITY);
    this.state = 'rise';

    if (this.jumpsUsed === 2) {
      this.play(animKey(PLAYER_SPRITE, ANIM.doubleJump), true);
      this.burst(PALETTE.neonCyan);
    }
  }

  private handleAbilities(time: number) {
    // Dash.
    if (
      GameState.has('dash') &&
      Phaser.Input.Keyboard.JustDown(this.keys.dash) &&
      time >= this.dashReadyAt
    ) {
      this.state = 'dash';
      this.dashEndsAt = time + DASH_MS;
      this.dashReadyAt = time + DASH_COOLDOWN_MS;
      this.setVelocity(this.facing * DASH_SPEED, 0);
      this.play(animKey(PLAYER_SPRITE, ANIM.dash), true);
      // El estirón horizontal vende la velocidad sin frames nuevos.
      this.setScale(1.35, 0.8);
      this.scene.tweens.add({ targets: this, scaleX: 1, scaleY: 1, duration: DASH_MS + 80 });
      this.burst(PALETTE.neonPink);
      return;
    }

    // Invertir gravedad.
    if (GameState.has('gravityFlip') && Phaser.Input.Keyboard.JustDown(this.keys.gravity)) {
      this.flipped = !this.flipped;
      this.setVelocityY(0);
      this.jumpsUsed = 0;
      this.burst(0x9d7bff);
      EventBus.emit('toast', this.flipped ? 'GRAVEDAD INVERTIDA' : 'GRAVEDAD RESTAURADA');
    }

    // Plataforma holográfica bajo los pies.
    if (
      GameState.has('holoPlatform') &&
      Phaser.Input.Keyboard.JustDown(this.keys.holo) &&
      time - this.holoUsedAt > 500
    ) {
      this.holoUsedAt = time;
      this.spawnHoloPlatform();
    }
  }

  private spawnHoloPlatform() {
    if (!this.holoGroup) return;

    const y = this.y + (this.flipped ? -20 : 20);
    const key = 'fx:holo';
    if (!this.scene.textures.exists(key)) {
      const g = this.scene.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(PALETTE.neonCyan, 0.35).fillRect(0, 0, 40, 5);
      g.fillStyle(PALETTE.neonCyan, 0.9).fillRect(0, 0, 40, 1);
      g.generateTexture(key, 40, 5);
      g.destroy();
    }

    const plate = this.holoGroup.create(this.x, y, key) as Phaser.Physics.Arcade.Sprite;
    plate.setDepth(5);
    plate.refreshBody();

    this.scene.tweens.add({
      targets: plate,
      alpha: { from: 1, to: 0 },
      duration: HOLO_LIFETIME_MS,
      onComplete: () => plate.destroy(),
    });
  }

  /**
   * Escalada de paredes: mientras se empuja contra la pared y se mantiene arriba,
   * Nova sube. El sprite se rota 90° para simular el agarre.
   */
  private tryClimb(_time: number) {
    if (!GameState.has('wallClimb') || this.touchingWall === 0 || this.onGround) {
      if (this.state === 'climb') {
        this.state = 'fall';
        this.setAngle(0);
      }
      return false;
    }

    const pushing =
      (this.touchingWall === -1 && this.keys.left.isDown) ||
      (this.touchingWall === 1 && this.keys.right.isDown);
    if (!pushing && !this.keys.up.isDown) {
      if (this.state === 'climb') {
        this.state = 'fall';
        this.setAngle(0);
      }
      return false;
    }

    this.state = 'climb';
    this.jumpsUsed = 0;
    this.arcadeBody.gravity.y = 0;

    const vertical = this.keys.up.isDown ? -1 : this.keys.down.isDown ? 1 : 0;
    this.setVelocity(0, vertical * CLIMB_SPEED);
    this.setAngle(this.touchingWall === 1 ? -90 : 90);
    this.play(animKey(PLAYER_SPRITE, ANIM.climb), true);

    // Saltar desde la pared impulsa hacia el lado opuesto.
    if (Phaser.Input.Keyboard.JustDown(this.keys.jump)) {
      this.setAngle(0);
      this.state = 'rise';
      this.setVelocity(-this.touchingWall * SPEED * 1.6, -JUMP_VELOCITY * 0.9);
      this.touchingWall = 0;
    }
    return true;
  }

  private resolveState() {
    const vy = this.arcadeBody.velocity.y;
    const rising = this.flipped ? vy > 20 : vy < -20;
    const falling = this.flipped ? vy < -20 : vy > 20;

    if (!this.onGround) {
      this.state = rising ? 'rise' : falling ? 'fall' : this.state;
      return;
    }
    this.setAngle(0);
    this.state = Math.abs(this.arcadeBody.velocity.x) > 8 ? 'run' : 'idle';
  }

  private applyAnimation() {
    const map: Partial<Record<PlayerStateName, string>> = {
      idle: ANIM.idle,
      run: ANIM.run,
      rise: ANIM.jumpRise,
      fall: ANIM.jumpFall,
      dash: ANIM.dash,
      climb: ANIM.climb,
      hurt: ANIM.hurt,
    };
    const anim = map[this.state];
    if (!anim) return;
    // No cortar el doble salto a medias.
    if (this.anims.currentAnim?.key === animKey(PLAYER_SPRITE, ANIM.doubleJump) && this.anims.isPlaying) {
      return;
    }
    this.play(animKey(PLAYER_SPRITE, anim), true);
  }

  private burst(color: number) {
    const key = `fx:burst:${color}`;
    if (!this.scene.textures.exists(key)) {
      const g = this.scene.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(color, 1).fillRect(0, 0, 2, 2);
      g.generateTexture(key, 2, 2);
      g.destroy();
    }
    this.scene.add
      .particles(this.x, this.y + 6, key, {
        lifespan: 320,
        speed: { min: 30, max: 90 },
        scale: { start: 1.2, end: 0 },
        alpha: { start: 0.9, end: 0 },
        blendMode: Phaser.BlendModes.ADD,
        emitting: false,
      })
      .setDepth(21)
      .explode(10);
  }

  /**
   * Ventana de gracia tras recibir un golpe: evita perder toda la integridad de
   * golpe cuando se cae encima de unos pinchos o un enemigo.
   */
  get isInvulnerable() {
    const now = this.scene.time.now;
    return now < this.hurtUntil + INVULNERABLE_MS || now < this.graceUntil;
  }

  /**
   * Invulnerabilidad temporal sin el estado de "herida", para justo después de
   * reaparecer: da tiempo a apartarse si el punto de retorno está cerca de un
   * peligro, en vez de encadenar muertes.
   */
  grantGrace(ms: number) {
    this.graceUntil = this.scene.time.now + ms;
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({
      targets: this,
      alpha: { from: 0.3, to: 1 },
      duration: 160,
      yoyo: true,
      repeat: Math.floor(ms / 320),
      onComplete: () => this.setAlpha(1),
    });
  }

  /** Devuelve el control tras reaparecer. */
  revive() {
    this.hurtUntil = 0;
    this.state = 'idle';
    this.setAngle(0);
    this.setAlpha(1);
    this.clearTint();
    this.arcadeBody.enable = true;
    this.play(animKey(PLAYER_SPRITE, ANIM.idle), true);
  }

  /** Daño: empuja hacia atrás y bloquea el control un instante. */
  hurt(fromX: number) {
    if (this.isInvulnerable) return;
    this.hurtUntil = this.scene.time.now + HURT_MS;
    this.state = 'hurt';
    this.setAngle(0);
    const away = this.x < fromX ? -1 : 1;
    this.setVelocity(away * 140, this.flipped ? 120 : -150);
    this.setTintFill(0xff2f6d);
    this.scene.time.delayedCall(120, () => this.clearTint());
    this.scene.cameras.main.shake(140, 0.006);

    // Parpadeo durante la invulnerabilidad, para que se vea que no cuenta el daño.
    this.scene.tweens.add({
      targets: this,
      alpha: { from: 1, to: 0.35 },
      duration: 120,
      yoyo: true,
      repeat: Math.floor(INVULNERABLE_MS / 240),
      onComplete: () => this.setAlpha(1),
    });
  }

  /** Desintegración final: los gatos se van en partículas luminosas. */
  dissolve(onComplete?: () => void) {
    this.state = 'dissolving';
    this.setVelocity(0, 0);
    this.arcadeBody.enable = false;
    this.burst(PALETTE.bone);
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleY: 1.4,
      duration: 1600,
      onComplete: () => onComplete?.(),
    });
  }

  override destroy(fromScene?: boolean) {
    this.trail?.destroy();
    super.destroy(fromScene);
  }
}

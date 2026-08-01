import Phaser from 'phaser';
import { CAT_FRAME } from '@/core/constants';
import { ANIM, animKey } from '@/core/assets';
import { NPCS } from '@shared/npcs';
import type { Emotion, NpcId } from '@shared/types';
import { label } from '@/ui/text';
import { hex } from '@/ui/text';

/** Tinte por emoción: el agente puede cambiarlo con la herramienta `cambiar_emocion`. */
const EMOTION_TINT: Record<Emotion, number> = {
  neutral: 0xffffff,
  duelo: 0x8fa4ff,
  olvido: 0xe6eeff,
  miedo: 0x9fe8e0,
  codicia: 0xffd79a,
  ira: 0xff9aae,
  esperanza: 0xb6ffc7,
  aceptacion: 0xffe9b0,
  verdad: 0xff9ac2,
};

/**
 * Gato NPC. Es un sprite estático con un aura de neón, un indicador de "pulsa E"
 * cuando Nova está cerca, y la capacidad de disolverse en partículas cuando el
 * agente decide que ha cumplido su propósito.
 */
export class NpcCat extends Phaser.Physics.Arcade.Sprite {
  readonly npcId: NpcId;
  private readonly aura: Phaser.GameObjects.Arc;
  private readonly nameTag: Phaser.GameObjects.Text;
  private readonly cue: Phaser.GameObjects.Text;
  private dissolved = false;

  constructor(scene: Phaser.Scene, x: number, y: number, npcId: NpcId) {
    const info = NPCS[npcId];
    super(scene, x, y, `cat:${info.sprite}:idle`);
    this.npcId = npcId;

    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.setDepth(18);
    this.setSize(16, 16).setOffset((CAT_FRAME - 16) / 2, CAT_FRAME - 18);
    this.play(animKey(info.sprite, ANIM.idle));

    // Aura pulsante que hace visible al NPC entre el neón del fondo.
    this.aura = scene.add
      .circle(x, y + 4, 14, info.color, 0.16)
      .setDepth(17)
      .setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({
      targets: this.aura,
      scale: { from: 0.85, to: 1.25 },
      alpha: { from: 0.18, to: 0.06 },
      duration: 1800,
      yoyo: true,
      repeat: -1,
    });

    this.nameTag = label(scene, x, y - 18, info.nombre, 'micro', hex(info.color))
      .setOrigin(0.5)
      .setDepth(19);

    this.cue = label(scene, x, y - 28, '[E] hablar', 'micro', '#ffb347')
      .setOrigin(0.5)
      .setDepth(19)
      .setVisible(false);
  }

  get info() {
    return NPCS[this.npcId];
  }

  setNearby(nearby: boolean) {
    if (this.dissolved) return;
    this.cue.setVisible(nearby);
  }

  setEmotion(emotion: Emotion) {
    this.setTint(EMOTION_TINT[emotion]);
    // Un pequeño rebote hace legible que el gato ha "reaccionado".
    this.scene.tweens.add({
      targets: this,
      scaleY: { from: 0.86, to: 1 },
      duration: 260,
      ease: 'Back.out',
    });
  }

  /** Habla sola: burbuja breve para líneas ambientales sin abrir el diálogo. */
  mutter(text: string) {
    const bubble = label(this.scene, this.x, this.y - 26, text, 'micro', '#d7e3ff')
      .setOrigin(0.5)
      .setDepth(19);
    this.scene.tweens.add({
      targets: bubble,
      y: bubble.y - 8,
      alpha: 0,
      duration: 2400,
      onComplete: () => bubble.destroy(),
    });
  }

  /**
   * "Todos desaparecen después de cumplir su propósito. Nunca vuelven a aparecer."
   */
  dissolve(onComplete?: () => void) {
    if (this.dissolved) return;
    this.dissolved = true;
    this.cue.setVisible(false);

    const key = `fx:dust:${this.info.color}`;
    if (!this.scene.textures.exists(key)) {
      const g = this.scene.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(this.info.color, 1).fillRect(0, 0, 2, 2);
      g.generateTexture(key, 2, 2);
      g.destroy();
    }

    this.scene.add
      .particles(this.x, this.y + 4, key, {
        lifespan: 1800,
        speed: { min: 6, max: 26 },
        angle: { min: 240, max: 300 },
        scale: { start: 1.4, end: 0 },
        alpha: { start: 0.9, end: 0 },
        blendMode: Phaser.BlendModes.ADD,
        emitting: false,
      })
      .setDepth(19)
      .explode(46);

    this.scene.tweens.add({
      targets: [this, this.aura, this.nameTag],
      alpha: 0,
      duration: 1700,
      onComplete: () => {
        this.aura.destroy();
        this.nameTag.destroy();
        this.cue.destroy();
        this.destroy();
        onComplete?.();
      },
    });
  }
}

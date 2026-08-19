import Phaser from 'phaser';
import { applyRenderScale } from '@/core/renderScale';
import { DEBUG, GAME_HEIGHT, GAME_WIDTH, PALETTE, SCENES, RENDER_SCALE } from '@/core/constants';
import { EventBus } from '@/core/EventBus';
import { drawPanel } from '@/ui/Panel';
import { Typewriter } from '@/ui/Typewriter';
import { hex, label } from '@/ui/text';
import { AgentClient } from '@/dialogue/AgentClient';
import { applyEffects } from '@/dialogue/effects';
import { ANIM, animKey } from '@/core/assets';
import { NPCS } from '@shared/npcs';
import { GameState } from '@/core/GameState';
import type { Emotion, NpcId } from '@shared/types';

export interface DialogueSceneData {
  npcId: NpcId;
}

/** Respuestas rápidas para quien no quiera escribir. */
const QUICK_REPLIES = [
  '¿Quién eres?',
  'Estoy atascada, ¿me ayudas?',
  '¿Qué está pasando con la ciudad?',
];

const MAX_INPUT = 160;
const PANEL_H = 92;

/**
 * Bocadillo de diálogo con el agente. El jugador escribe libremente y el NPC
 * responde a través de `/api/agent/chat`, donde Gemini decide qué herramientas
 * usar. Los efectos devueltos se aplican al cerrar el turno.
 */
export class DialogueScene extends Phaser.Scene {
  private npcId!: NpcId;
  private input$ = '';
  private waiting = false;
  private dissolvePending = false;
  private pendingNotices: string[] = [];

  private replyText!: Phaser.GameObjects.Text;
  private inputText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private quickText!: Phaser.GameObjects.Text;
  private typewriter!: Typewriter;
  private portrait!: Phaser.GameObjects.Sprite;
  private abortController?: AbortController;

  constructor() {
    super({ key: SCENES.dialogue, active: false });
  }

  create(data: DialogueSceneData) {
    applyRenderScale(this);
    this.npcId = data.npcId;
    const info = NPCS[this.npcId];
    const accent = info.color;

    this.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, PALETTE.night, 0.55)
      .setOrigin(0, 0)
      .setScrollFactor(0);

    const x = 8;
    const y = GAME_HEIGHT - PANEL_H - 8;
    const w = GAME_WIDTH - 16;
    drawPanel(this, x, y, w, PANEL_H, accent);

    // Retrato: el propio sprite del gato, ampliado.
    this.portrait = this.add
      .sprite(x + 20, y + 26, `cat:${info.sprite}:idle`)
      .setScale(1.4)
      .setOrigin(0.5);
    this.portrait.play(animKey(info.sprite, ANIM.idle));

    label(this, x + 40, y + 6, info.nombre, 'small', hex(accent));
    this.statusText = label(this, x + w - 8, y + 6, '', 'micro', '#6f8bd0').setOrigin(1, 0);

    this.replyText = label(this, x + 40, y + 18, '', 'micro', '#d7e3ff')
      .setWordWrapWidth((w - 50) * RENDER_SCALE)
      .setLineSpacing(3 * RENDER_SCALE);

    this.typewriter = new Typewriter(this, this.replyText, { speed: 22 });
    this.typewriter.start(info.saludo);

    // Línea de entrada.
    this.add
      .rectangle(x + 6, y + PANEL_H - 22, w - 12, 12, accent, 0.08)
      .setOrigin(0, 0.5);
    this.inputText = label(this, x + 10, y + PANEL_H - 27, '> ', 'micro', '#ffb347');

    this.quickText = label(
      this,
      x + 10,
      y + PANEL_H - 13,
      '1/2/3 respuestas rápidas   ENTER enviar   ESC cerrar',
      'micro',
      '#3a4770',
    );

    this.bindKeyboard();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.abortController?.abort();
      this.typewriter.destroy();
      this.input.keyboard?.removeAllListeners();
    });
  }

  private bindKeyboard() {
    const kb = this.input.keyboard!;

    kb.on('keydown', (event: KeyboardEvent) => {
      if (this.waiting) return;

      if (event.key === 'Escape') {
        this.close();
        return;
      }
      if (event.key === 'Enter') {
        if (this.input$.length > 0) {
          this.send(this.input$);
        } else if (!this.typewriter.isDone) {
          // ENTER vacío mientras el gato está hablando: acelerar la animación.
          this.typewriter.skip();
        }
        // ENTER vacío con typewriter terminado no hace nada: solo ESC cierra.
        return;
      }
      if (event.key === 'Backspace') {
        this.input$ = this.input$.slice(0, -1);
        this.renderInput();
        return;
      }
      // Respuestas rápidas solo cuando no se ha empezado a escribir.
      if (this.input$.length === 0 && ['1', '2', '3'].includes(event.key)) {
        this.send(QUICK_REPLIES[Number(event.key) - 1]);
        return;
      }
      // `key.length === 1` cubre acentos y ñ sin depender de códigos de tecla.
      if (event.key.length === 1 && this.input$.length < MAX_INPUT) {
        this.input$ += event.key;
        this.renderInput();
      }
    });
  }

  private renderInput() {
    this.inputText.setText(`> ${this.input$}`);
    this.quickText.setVisible(this.input$.length === 0);
  }

  private async send(message: string) {
    const text = message.trim();
    if (!text) return; // Solo espacios: ignorar.

    this.waiting = true;
    this.input$ = '';
    this.renderInput();
    this.inputText.setText(`> ${text}`).setColor('#6f8bd0');
    this.setStatus('pensando');

    this.abortController = new AbortController();
    const response = await AgentClient.chat(this.npcId, text, this.abortController.signal);

    const outcome = applyEffects(response.effects);
    if (outcome.emotion) this.applyEmotion(outcome.emotion);
    this.dissolvePending = outcome.dissolve;
    this.pendingNotices = outcome.notices;

    this.setStatus(response.fallback ? 'sin conexión' : '');
    this.typewriter.start(response.reply);

    if (DEBUG.has('agent') && response.toolTrace.length > 0) {
      console.log(`[agent:${this.npcId}] herramientas usadas:`, response.toolTrace);
      this.showToolTrace(response.toolTrace.map((t) => t.name));
    }

    this.waiting = false;
    this.inputText.setColor('#ffb347');
  }

  private applyEmotion(emotion: Emotion) {
    EventBus.emit('npc:emotion', this.npcId, emotion);
  }

  /** Traza de herramientas visible con `?debug=agent`. */
  private showToolTrace(names: string[]) {
    const trace = label(this, GAME_WIDTH - 6, 24, names.join('\n'), 'micro', '#8b5cff')
      .setOrigin(1, 0)
      .setAlign('right');
    this.time.delayedCall(4000, () => trace.destroy());
  }

  private setStatus(text: string) {
    this.statusText.setText(text);
    this.tweens.killTweensOf(this.statusText);
    if (!text) return;
    this.tweens.add({
      targets: this.statusText,
      alpha: { from: 1, to: 0.3 },
      duration: 500,
      yoyo: true,
      repeat: -1,
    });
  }

  private close() {
    // Marcarlo en el estado emite `npc:dissolve`, que `GameScene` escucha para
    // desintegrar al gato, y lo deja registrado para no volver a generarlo.
    if (this.dissolvePending) GameState.dissolveNpc(this.npcId);
    for (const notice of this.pendingNotices) EventBus.emit('toast', notice);

    EventBus.emit('dialogue:closed');
    this.scene.stop();
  }
}

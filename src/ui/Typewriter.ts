import Phaser from 'phaser';

export interface TypewriterOptions {
  /** Milisegundos por carácter. */
  speed?: number;
  /** Pausa extra tras signos de puntuación fuerte. */
  punctuationPause?: number;
  onChar?: () => void;
  onDone?: () => void;
}

/**
 * Escribe texto carácter a carácter en un objeto Text. Permite saltar al final
 * (el jugador pulsa para acelerar) y respeta pausas en la puntuación, que es lo
 * que da ritmo a los diálogos.
 */
export class Typewriter {
  private timer?: Phaser.Time.TimerEvent;
  private index = 0;
  private full = '';
  private done = true;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly target: Phaser.GameObjects.Text,
    private readonly options: TypewriterOptions = {},
  ) {}

  get isDone() {
    return this.done;
  }

  start(text: string) {
    this.stop();
    this.full = text;
    this.index = 0;
    this.done = false;
    this.target.setText('');
    this.schedule(0);
  }

  private schedule(delay: number) {
    this.timer = this.scene.time.delayedCall(delay, () => this.step());
  }

  private step() {
    if (this.index >= this.full.length) {
      this.done = true;
      this.options.onDone?.();
      return;
    }

    const char = this.full[this.index++];
    this.target.setText(this.full.slice(0, this.index));
    if (char.trim()) this.options.onChar?.();

    const base = this.options.speed ?? 26;
    const pause = this.options.punctuationPause ?? 220;
    const extra = '.!?…'.includes(char) ? pause : ',;:'.includes(char) ? pause / 2 : 0;
    this.schedule(base + extra);
  }

  /** Muestra el texto completo de golpe. */
  skip() {
    if (this.done) return;
    this.stop();
    this.index = this.full.length;
    this.target.setText(this.full);
    this.done = true;
    this.options.onDone?.();
  }

  stop() {
    this.timer?.remove();
    this.timer = undefined;
  }

  destroy() {
    this.stop();
  }
}

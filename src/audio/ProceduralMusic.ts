/**
 * Música y ambiente sintetizados en el navegador con WebAudio. No hay archivos de
 * audio en el proyecto, así que el synthwave melancólico y el tema al piano se
 * generan aquí.
 *
 * El tema principal es una progresión en La menor; la versión al piano de los
 * créditos usa la misma melodía con otra envolvente, como pide el guion.
 */

/** Frecuencias (Hz) de la melodía principal, en La menor. */
const MELODY = [440, 523.25, 587.33, 659.25, 587.33, 523.25, 493.88, 440];
/** Bajo de la progresión Am - F - C - G. */
const BASS = [110, 87.31, 130.81, 98];

export class ProceduralMusic {
  private ctx?: AudioContext;
  private master?: GainNode;
  private timers: number[] = [];
  private nodes: AudioNode[] = [];
  private stopped = false;

  private ensureContext(): AudioContext | undefined {
    if (this.stopped) return undefined;
    if (this.ctx) return this.ctx;

    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return undefined;

    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.22;
    this.master.connect(this.ctx.destination);
    return this.ctx;
  }

  /** El navegador exige un gesto del usuario antes de sonar. */
  async resume() {
    const ctx = this.ensureContext();
    if (ctx?.state === 'suspended') await ctx.resume();
  }

  setVolume(value: number) {
    if (this.master) this.master.gain.value = Math.max(0, Math.min(1, value)) * 0.5;
  }

  /** Pads de sintetizador con la progresión de fondo. Se repite indefinidamente. */
  playSynthwave() {
    const ctx = this.ensureContext();
    if (!ctx || !this.master) return;

    const barSeconds = 4;
    const loop = () => {
      if (this.stopped) return;
      const now = ctx.currentTime;
      BASS.forEach((freq, i) => {
        this.pad(freq, now + i * barSeconds, barSeconds * 0.95);
        // Quinta por encima: engorda el pad sin ensuciar la tonalidad.
        this.pad(freq * 1.5, now + i * barSeconds, barSeconds * 0.9, 0.35);
      });
      this.timers.push(
        window.setTimeout(loop, BASS.length * barSeconds * 1000 - 120),
      );
    };
    loop();
  }

  /** Versión al piano del tema principal, para los créditos. */
  playPianoTheme() {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const noteSeconds = 0.85;
    const loop = () => {
      if (this.stopped) return;
      const now = ctx.currentTime;
      MELODY.forEach((freq, i) => {
        this.pianoNote(freq, now + i * noteSeconds);
        // Acompañamiento de octava baja cada dos notas.
        if (i % 2 === 0) this.pianoNote(freq / 2, now + i * noteSeconds, 0.35);
      });
      this.timers.push(
        window.setTimeout(loop, MELODY.length * noteSeconds * 1000 + 900),
      );
    };
    loop();
  }

  /** Ruido filtrado que imita la lluvia constante de la ciudad. */
  playRainAmbience() {
    const ctx = this.ensureContext();
    if (!ctx || !this.master) return;

    // Un buffer de dos segundos de ruido blanco en bucle es suficiente.
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200;
    filter.Q.value = 0.6;

    const gain = ctx.createGain();
    gain.gain.value = 0.06;

    source.connect(filter).connect(gain).connect(this.master);
    source.start();
    this.nodes.push(source, filter, gain);
  }

  /** Efecto puntual: recogida, salto doble, hackeo. */
  blip(frequency = 880, duration = 0.08) {
    const ctx = this.ensureContext();
    if (!ctx || !this.master) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(frequency * 1.8, ctx.currentTime + duration);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain).connect(this.master);
    osc.start();
    osc.stop(ctx.currentTime + duration + 0.02);
  }

  private pad(frequency: number, at: number, duration: number, level = 0.6) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.value = frequency;
    filter.type = 'lowpass';
    filter.frequency.value = 900;

    // Envolvente lenta: es lo que le da el carácter melancólico.
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.linearRampToValueAtTime(0.09 * level, at + duration * 0.35);
    gain.gain.linearRampToValueAtTime(0.0001, at + duration);

    osc.connect(filter).connect(gain).connect(this.master!);
    osc.start(at);
    osc.stop(at + duration + 0.05);
  }

  private pianoNote(frequency: number, at: number, level = 1) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.value = frequency;

    // Ataque instantáneo y caída larga: aproximación barata a un piano.
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.linearRampToValueAtTime(0.16 * level, at + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 1.9);

    osc.connect(gain).connect(this.master!);
    osc.start(at);
    osc.stop(at + 2);
  }

  stop() {
    this.stopped = true;
    for (const timer of this.timers) window.clearTimeout(timer);
    this.timers = [];
    for (const node of this.nodes) {
      try {
        (node as OscillatorNode).stop?.();
      } catch {
        /* ya detenido */
      }
      node.disconnect();
    }
    this.nodes = [];
    void this.ctx?.close();
    this.ctx = undefined;
  }
}

/** Instancia compartida para el juego; los créditos crean la suya. */
export const Music = new ProceduralMusic();

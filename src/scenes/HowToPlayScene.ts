import Phaser from 'phaser';
import { applyRenderScale } from '@/core/renderScale';
import { GAME_HEIGHT, GAME_WIDTH, PALETTE, SCENES } from '@/core/constants';
import { GameState } from '@/core/GameState';
import { EventBus } from '@/core/EventBus';
import { ABILITIES, ABILITY_ORDER } from '@/abilities';
import { drawPanel } from '@/ui/Panel';
import { hex, label, neonLabel } from '@/ui/text';

export interface HowToPlaySceneData {
  /** true si se abre como pausa desde dentro del juego. */
  overlay?: boolean;
}

/** Controles básicos, siempre disponibles. */
const BASICS: Array<[string, string]> = [
  ['← →', 'Moverse'],
  ['ESPACIO', 'Saltar'],
  ['E', 'Hablar con un gato / hackear una puerta'],
  ['ENTER', 'Enviar lo que escribes en un diálogo'],
  ['1 2 3', 'Respuestas rápidas en un diálogo'],
  ['ESC', 'Salir al menú'],
  ['H', 'Abrir esta ayuda'],
];

const OBJETIVOS = [
  'Llega a la Torre de la Memoria atravesando siete distritos.',
  'Cada distrito te da una habilidad nueva y te deja pasar al siguiente.',
  'Recoge los rombos de datos: son fragmentos de memoria.',
  'El COLLAR es tu vida: al vaciarse reapareces en el último punto seguro.',
  'Caer al vacío o al agua resta dos segmentos de golpe.',
];

/** Explicación de la parte de IA, que no es obvia si no se cuenta. */
const IA = [
  'En cada distrito hay un gato con un aura de color. Acércate y pulsa E.',
  'Se abre un chat: ESCRIBE lo que quieras y te contesta en personaje.',
  'No hay diálogos pregrabados. Un modelo de lenguaje decide qué responder,',
  'y puede usar herramientas: darte un fragmento, revelarte una pista del',
  'acertijo, cambiar de humor, corromper la realidad o despedirse para',
  'siempre. Recuerda lo que hablasteis en encuentros anteriores.',
  'Si no quieres escribir, pulsa 1, 2 o 3 para preguntas rápidas.',
];

/**
 * Pantalla de ayuda. Se abre desde el menú y con `H` durante la partida (donde
 * funciona como pausa). Los controles de habilidades solo se muestran cuando ya
 * se han desbloqueado, para no destripar el progreso.
 */
export class HowToPlayScene extends Phaser.Scene {
  private overlay = false;

  constructor() {
    super({ key: SCENES.howToPlay, active: false });
  }

  create(data: HowToPlaySceneData) {
    applyRenderScale(this);
    this.overlay = Boolean(data?.overlay);

    this.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, PALETTE.night, this.overlay ? 0.88 : 1)
      .setOrigin(0, 0)
      .setScrollFactor(0);

    drawPanel(this, 8, 6, GAME_WIDTH - 16, GAME_HEIGHT - 12, PALETTE.neonCyan, 0.6);

    neonLabel(this, GAME_WIDTH / 2, 14, 'CÓMO JUGAR', 'small', '#3fe0d0').setOrigin(0.5, 0);

    const yObjetivos = this.drawObjectives(26);
    const yIA = this.drawAI(yObjetivos + 4);
    const yControles = this.drawBasics(yIA + 4);
    this.drawAbilities(yControles + 4);

    const hint = label(
      this,
      GAME_WIDTH / 2,
      GAME_HEIGHT - 16,
      this.overlay ? 'H o ESC para volver al juego' : 'ESC o ENTER para volver',
      'micro',
      '#6f8bd0',
    ).setOrigin(0.5);
    this.tweens.add({
      targets: hint,
      alpha: { from: 0.45, to: 1 },
      duration: 900,
      yoyo: true,
      repeat: -1,
    });

    const close = () => this.close();
    this.input.keyboard!.on('keydown-ESC', close);
    this.input.keyboard!.on('keydown-ENTER', close);
    this.input.keyboard!.on('keydown-H', close);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.removeAllListeners();
    });
  }

  private drawObjectives(top: number) {
    label(this, 18, top, 'QUÉ TIENES QUE HACER', 'micro', '#ff2f6d');
    OBJETIVOS.forEach((line, i) => {
      label(this, 18, top + 10 + i * 8, line, 'micro', '#a8b8e8');
    });
    return top + 10 + OBJETIVOS.length * 8;
  }

  /**
   * Sección de la IA. Consulta `/api/health` para avisar si el agente está en modo
   * de reserva: sin `GEMINI_API_KEY` los gatos usan diálogos escritos a mano y el
   * jugador no tendría forma de saberlo.
   */
  private drawAI(top: number) {
    label(this, 18, top, 'HABLAR CON LA IA', 'micro', '#3fe0d0');
    IA.forEach((line, i) => {
      label(this, 18, top + 10 + i * 8, line, 'micro', '#a8b8e8');
    });

    const bottom = top + 10 + IA.length * 8;
    const estado = label(this, 18, bottom, 'comprobando el agente...', 'micro', '#3a4770');

    void fetch('/api/health')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('sin servidor'))))
      .then((data: { agente?: string; model?: string }) => {
        if (!estado.active) return;
        const online = data.agente === 'gemini';
        estado
          .setText(
            online
              ? `AGENTE ACTIVO (${data.model}) — los gatos improvisan`
              : 'AGENTE EN RESERVA — falta GEMINI_API_KEY, diálogos escritos a mano',
          )
          .setColor(online ? '#7dff9b' : '#ffb347');
      })
      .catch(() => {
        if (!estado.active) return;
        estado.setText('SERVIDOR NO DISPONIBLE — diálogos locales').setColor('#ff4d6d');
      });

    return bottom + 8;
  }

  /** Devuelve la coordenada Y donde termina el bloque. */
  private drawBasics(top: number) {
    label(this, 18, top, 'CONTROLES', 'micro', '#ff2f6d');

    BASICS.forEach(([key, desc], i) => {
      // Dos columnas, para que quepan sin alargar el panel.
      const col = i % 2;
      const row = Math.floor(i / 2);
      const y = top + 10 + row * 8;
      label(this, 18 + col * 220, y, key, 'micro', '#ffb347');
      label(this, 66 + col * 220, y, desc, 'micro', '#d7e3ff');
    });
    return top + 10 + Math.ceil(BASICS.length / 2) * 8;
  }

  /** Solo las habilidades ya conseguidas. */
  private drawAbilities(top: number) {
    const owned = ABILITY_ORDER.filter((id) => GameState.has(id));

    label(this, 18, top, 'TUS HABILIDADES', 'micro', '#ff2f6d');
    if (owned.length === 0) {
      label(
        this,
        18,
        top + 11,
        'Todavía ninguna. Las encontrarás en cada distrito.',
        'micro',
        '#3a4770',
      );
      return;
    }

    owned.forEach((id, i) => {
      const spec = ABILITIES[id];
      const col = i % 2;
      const y = top + 10 + Math.floor(i / 2) * 8;
      label(this, 18 + col * 220, y, spec.tecla, 'micro', hex(spec.color));
      label(this, 96 + col * 220, y, `${spec.glifo} ${spec.nombre}`, 'micro', '#d7e3ff');
    });
  }

  private close() {
    if (this.overlay) {
      // Reanudar el juego y devolverle el foco del teclado.
      this.scene.stop();
      EventBus.emit('dialogue:closed');
      return;
    }
    this.scene.start(SCENES.menu);
  }
}

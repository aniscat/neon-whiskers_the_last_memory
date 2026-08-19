import Phaser from 'phaser';
import { applyRenderScale } from '@/core/renderScale';
import { GAME_HEIGHT, GAME_WIDTH, PALETTE, SCENES } from '@/core/constants';
import { drawPanel } from '@/ui/Panel';
import { label, neonLabel } from '@/ui/text';

/**
 * Pantalla de arquitectura del agente de IA.
 *
 * Accesible desde el menú principal como "ARQUITECTURA IA".
 * Muestra un diagrama visual por bloques del flujo cliente-servidor-Gemini,
 * las herramientas del agente, dónde se usa en el juego y las garantías de diseño.
 */
export class AgentArchScene extends Phaser.Scene {
  constructor() {
    super(SCENES.agentArch);
  }

  create() {
    applyRenderScale(this);
    this.cameras.main.setBackgroundColor(PALETTE.night);
    this.cameras.main.fadeIn(600, 0, 0, 0);

    this.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, PALETTE.night, 1)
      .setOrigin(0, 0)
      .setScrollFactor(0);

    drawPanel(this, 8, 6, GAME_WIDTH - 16, GAME_HEIGHT - 12, PALETTE.neonViolet, 0.5);

    neonLabel(this, GAME_WIDTH / 2, 14, 'ARQUITECTURA DEL AGENTE DE IA', 'small', '#8b5cff').setOrigin(
      0.5,
      0,
    );

    const g = this.add.graphics();

    // ─── DIAGRAMA DE FLUJO ──────────────────────────────────────────────────
    // Tres cajas: CLIENTE | SERVIDOR | GEMINI API
    // Disposición horizontal centrada en y≈80

    const boxY = 36;
    const boxH = 28;

    // Caja CLIENTE
    const cxClient = 58;
    this.drawBox(g, cxClient - 50, boxY, 100, boxH, 0x3fe0d0);
    label(this, cxClient, boxY + 6, 'CLIENTE', 'micro', '#3fe0d0').setOrigin(0.5, 0);
    label(this, cxClient, boxY + 14, 'GameState', 'micro', '#a8b8e8').setOrigin(0.5, 0);
    label(this, cxClient, boxY + 21, 'DialogueScene', 'micro', '#6f8bd0').setOrigin(0.5, 0);

    // Caja SERVIDOR
    const cxServer = GAME_WIDTH / 2;
    this.drawBox(g, cxServer - 54, boxY, 108, boxH, 0x8b5cff);
    label(this, cxServer, boxY + 6, 'SERVIDOR', 'micro', '#8b5cff').setOrigin(0.5, 0);
    label(this, cxServer, boxY + 14, 'Express + Agent', 'micro', '#a8b8e8').setOrigin(0.5, 0);
    label(this, cxServer, boxY + 21, 'personas + tools', 'micro', '#6f8bd0').setOrigin(0.5, 0);

    // Caja GEMINI
    const cxGemini = GAME_WIDTH - 62;
    this.drawBox(g, cxGemini - 52, boxY, 104, boxH, 0xff2f6d);
    label(this, cxGemini, boxY + 6, 'GEMINI API', 'micro', '#ff2f6d').setOrigin(0.5, 0);
    label(this, cxGemini, boxY + 14, 'LLM + tool use', 'micro', '#a8b8e8').setOrigin(0.5, 0);
    label(this, cxGemini, boxY + 21, 'loop hasta reply', 'micro', '#6f8bd0').setOrigin(0.5, 0);

    // Flechas horizontales entre cajas
    const midY = boxY + boxH / 2;
    // Cliente → Servidor (mensaje + snapshot)
    this.drawArrow(g, cxClient + 50, midY, cxServer - 55, midY, 0x3fe0d0);
    label(this, (cxClient + 50 + cxServer - 55) / 2, midY - 8, 'POST /api/agent/chat', 'micro', '#3fe0d0').setOrigin(0.5, 1);
    label(this, (cxClient + 50 + cxServer - 55) / 2, midY - 1, 'msg + snapshot', 'micro', '#6f8bd0').setOrigin(0.5, 1);

    // Servidor ↔ Gemini (bidireccional)
    this.drawArrow(g, cxServer + 55, midY - 3, cxGemini - 53, midY - 3, 0x8b5cff);
    this.drawArrow(g, cxGemini - 53, midY + 4, cxServer + 55, midY + 4, 0xff2f6d);
    label(this, (cxServer + 55 + cxGemini - 53) / 2, midY - 10, 'prompt', 'micro', '#8b5cff').setOrigin(0.5, 1);
    label(this, (cxServer + 55 + cxGemini - 53) / 2, midY + 5, 'reply + effects', 'micro', '#ff2f6d').setOrigin(0.5, 0);

    // Servidor → Cliente (flecha de retorno, curvada hacia abajo)
    const returnY = boxY + boxH + 10;
    g.lineStyle(1, 0xffb347, 0.9);
    g.beginPath();
    g.moveTo(cxServer - 54, boxY + boxH);
    g.lineTo(cxServer - 54, returnY);
    g.lineTo(cxClient + 2, returnY);
    g.lineTo(cxClient + 2, boxY + boxH);
    g.strokePath();
    // Punta de flecha
    g.fillStyle(0xffb347, 0.9);
    g.fillTriangle(cxClient + 2, boxY + boxH, cxClient - 3, boxY + boxH + 5, cxClient + 7, boxY + boxH + 5);
    label(this, (cxClient + cxServer) / 2, returnY - 1, '{ reply, effects[], toolTrace }', 'micro', '#ffb347').setOrigin(0.5, 1);

    // ─── HERRAMIENTAS ───────────────────────────────────────────────────────
    const toolsY = boxY + boxH + 22;
    label(this, 12, toolsY, 'HERRAMIENTAS DEL AGENTE', 'micro', '#ff2f6d');

    const herramientas: Array<[string, string]> = [
      ['consultar_estado_jugador', 'zona, habilidades, fragmentos, corrupción'],
      ['recuperar_fragmento_memoria', 'busca en el lore canónico (shared/lore.ts)'],
      ['otorgar_fragmento_memoria', 'entrega el recuerdo a Nova'],
      ['revelar_pista', 'pista del acertijo en 3 niveles de concreción'],
      ['corromper_realidad', 'glitches, lluvia invertida, signos alterados'],
      ['cambiar_emocion', 'tono y tinte del personaje NPC'],
      ['despedirse_para_siempre', 'el gato se disuelve y no vuelve a aparecer'],
    ];

    let ty = toolsY + 10;
    for (const [tool, desc] of herramientas) {
      // Punto de color
      g.fillStyle(0xffb347, 1);
      g.fillRect(12, ty + 1, 3, 3);
      label(this, 18, ty, tool, 'micro', '#ffb347');
      label(this, 22, ty + 7, desc, 'micro', '#6f8bd0');
      ty += 15;
    }

    // ─── DÓNDE SE USA EN EL JUEGO ───────────────────────────────────────────
    const useY = ty + 3;
    label(this, 12, useY, '¿DÓNDE SE USA EN EL JUEGO?', 'micro', '#3fe0d0');

    const usos: Array<[string, string]> = [
      ['[E] cerca de un gato NPC', 'abre DialogueScene → manda el snapshot al agente'],
      ['Agente responde', 'Gemini llama herramientas (lore, pistas, efectos)'],
      ['effects[] aplicados', 'corrupción sube, habilidad desbloqueada, gato disuelto'],
      ['Sin GEMINI_API_KEY', 'el servidor usa diálogos pregrabados (fallback.ts)'],
      ['Sin servidor', 'el cliente usa AgentClient.offline() con respuestas locales'],
    ];

    let uy = useY + 10;
    for (const [trigger, effect] of usos) {
      g.fillStyle(0x3fe0d0, 1);
      g.fillRect(12, uy + 1, 3, 3);
      label(this, 18, uy, trigger, 'micro', '#3fe0d0');
      label(this, 22, uy + 7, effect, 'micro', '#6f8bd0');
      uy += 15;
    }

    // ─── GARANTÍAS ──────────────────────────────────────────────────────────
    const guarY = uy + 3;
    label(this, 12, guarY, 'GARANTÍAS DE DISEÑO', 'micro', '#ff2f6d');
    const garantias = [
      'El servidor NUNCA muta GameState — solo devuelve effects[].',
      'El lore canónico (shared/lore.ts) limita lo que el agente puede inventar.',
    ];
    let gy = guarY + 10;
    for (const g2 of garantias) {
      label(this, 18, gy, g2, 'micro', '#a8b8e8');
      gy += 8;
    }

    // Hint de salida parpadeante
    const hint = label(
      this,
      GAME_WIDTH / 2,
      GAME_HEIGHT - 10,
      'ESC o ENTER para volver al menú',
      'micro',
      '#6f8bd0',
    ).setOrigin(0.5);
    this.tweens.add({
      targets: hint,
      alpha: { from: 0.4, to: 1 },
      duration: 900,
      yoyo: true,
      repeat: -1,
    });

    const close = () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once(
        Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
        () => this.scene.start(SCENES.menu),
      );
    };
    this.input.keyboard!.on('keydown-ESC', close);
    this.input.keyboard!.on('keydown-ENTER', close);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.removeAllListeners();
    });
  }

  /** Dibuja una caja rectangular con borde de color y fondo semitransparente. */
  private drawBox(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, color: number) {
    g.fillStyle(color, 0.08);
    g.fillRect(x, y, w, h);
    g.lineStyle(1, color, 0.8);
    g.strokeRect(x, y, w, h);
  }

  /** Dibuja una flecha horizontal de fromX,fromY a toX,toY. */
  private drawArrow(g: Phaser.GameObjects.Graphics, x1: number, y1: number, x2: number, y2: number, color: number) {
    g.lineStyle(1, color, 0.9);
    g.beginPath();
    g.moveTo(x1, y1);
    g.lineTo(x2, y2);
    g.strokePath();
    // Punta
    const dir = x2 > x1 ? 1 : -1;
    g.fillStyle(color, 0.9);
    g.fillTriangle(x2, y2, x2 - dir * 5, y2 - 3, x2 - dir * 5, y2 + 3);
  }
}

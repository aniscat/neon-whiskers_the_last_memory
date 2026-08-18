import Phaser from 'phaser';
import { applyRenderScale } from '@/core/renderScale';
import { GAME_HEIGHT, GAME_WIDTH, SCENES, RENDER_SCALE } from '@/core/constants';
import { GameState } from '@/core/GameState';
import { MEMORY_FRAGMENTS } from '@shared/lore';
import { label, neonLabel } from '@/ui/text';
import { Music, ProceduralMusic } from '@/audio/ProceduralMusic';

export interface CreditsSceneData {
  fromMenu?: boolean;
}

const CREDITS = [
  ['NEON WHISKERS', 'THE LAST MEMORY'],
  ['TEMAS', 'La memoria como forma de inmortalidad'],
  ['', 'El duelo y la aceptación de la pérdida'],
  ['', 'La identidad y lo que nos hace ser quienes somos'],
  ['', 'La soledad de una IA creada para cuidar a alguien que ya no existe'],
  ['', 'El amor entre un padre y su hija'],
  ['DISEÑO Y CÓDIGO', 'Phaser 3 · TypeScript · Vite'],
  ['DIÁLOGO', 'Agente con tool use sobre Google Gemini'],
  ['SPRITES', 'AllCatsDemo · CatMaterialsDEMO'],
  ['ARTE DE ENTORNO', 'Generado por código'],
  ['MÚSICA', 'Síntesis procedural con WebAudio'],
  ['', ''],
  ['', 'Gracias por recordar.'],
];

/**
 * Créditos con scroll y el tema principal al piano. Muestra también el recuento
 * de fragmentos: cuántos recuerdos de Noa consiguió recuperar el jugador.
 */
export class CreditsScene extends Phaser.Scene {
  private music?: ProceduralMusic;

  constructor() {
    super(SCENES.credits);
  }

  create(data: CreditsSceneData) {
    applyRenderScale(this);
    this.cameras.main.setBackgroundColor(0x05060d);
    this.cameras.main.fadeIn(1200, 0, 0, 0);

    // Callar el tema del juego: si no, synthwave y piano suenan a la vez.
    Music.stop();
    this.music = new ProceduralMusic();
    void this.music.resume().then(() => this.music?.playPianoTheme());

    const container = this.add.container(0, GAME_HEIGHT + 20);

    let y = 0;
    for (const [heading, line] of CREDITS) {
      if (heading) {
        container.add(
          neonLabel(this, GAME_WIDTH / 2, y, heading, 'small', '#3fe0d0').setOrigin(0.5),
        );
        y += 14;
      }
      if (line) {
        container.add(label(this, GAME_WIDTH / 2, y, line, 'micro', '#a8b8e8').setOrigin(0.5));
        y += 11;
      }
      y += 6;
    }

    if (!data?.fromMenu) {
      const minutos = Math.floor(GameState.tiempo / 60);
      container.add(
        label(
          this,
          GAME_WIDTH / 2,
          y + 12,
          `Recuerdos recuperados: ${GameState.fragmentos.size} de ${MEMORY_FRAGMENTS.length}\nTiempo: ${minutos} min`,
          'micro',
          '#ffb347',
        )
          .setOrigin(0.5)
          .setAlign('center')
          .setLineSpacing(4 * RENDER_SCALE),
      );
      y += 40;
    }

    const totalHeight = y + GAME_HEIGHT;
    this.tweens.add({
      targets: container,
      y: -totalHeight + GAME_HEIGHT,
      duration: 34000,
      ease: 'Linear',
      onComplete: () => this.exit(),
    });

    label(this, GAME_WIDTH - 6, GAME_HEIGHT - 8, 'ESC volver al menú', 'micro', '#3a4770').setOrigin(
      1,
      1,
    );
    this.input.keyboard!.on('keydown-ESC', () => this.exit());

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.music?.stop();
      this.input.keyboard?.removeAllListeners();
    });
  }

  private exit() {
    this.cameras.main.fadeOut(800, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(SCENES.menu);
    });
  }
}

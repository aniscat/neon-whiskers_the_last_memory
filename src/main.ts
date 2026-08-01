import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, PALETTE } from '@/core/constants';
import { BootScene } from '@/scenes/BootScene';
import { PreloadScene } from '@/scenes/PreloadScene';
import { MainMenuScene } from '@/scenes/MainMenuScene';
import { HowToPlayScene } from '@/scenes/HowToPlayScene';
import { IntroScene } from '@/scenes/IntroScene';
import { GameScene } from '@/scenes/GameScene';
import { HUDScene } from '@/scenes/HUDScene';
import { DialogueScene } from '@/scenes/DialogueScene';
import { MemoryFragmentScene } from '@/scenes/MemoryFragmentScene';
import { TowerBossScene } from '@/scenes/TowerBossScene';
import { RevelationScene } from '@/scenes/RevelationScene';
import { EndingScene } from '@/scenes/EndingScene';
import { CreditsScene } from '@/scenes/CreditsScene';
import { DebugSheetsScene } from '@/scenes/DebugSheetsScene';
import { Music } from '@/audio/ProceduralMusic';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: PALETTE.night,
  // Pixel art nítido: sin suavizado y sin posiciones subpíxel al redondear.
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 }, // la gravedad la controla cada cuerpo (habilidad gravityFlip)
      debug: false,
    },
  },
  scene: [
    BootScene,
    PreloadScene,
    MainMenuScene,
    IntroScene,
    GameScene,
    HUDScene,
    // El orden importa: Phaser dibuja las escenas activas en el orden de esta
    // lista, así que todo lo que funcione como superposición sobre el juego
    // (diálogo, fragmentos, ayuda) tiene que ir DESPUÉS de GameScene y HUDScene.
    DialogueScene,
    MemoryFragmentScene,
    HowToPlayScene,
    TowerBossScene,
    RevelationScene,
    EndingScene,
    CreditsScene,
    DebugSheetsScene,
  ],
};

try {
  const game = new Phaser.Game(config);

  // El audio solo puede arrancar tras un gesto del usuario.
  const startAudio = () => {
    void Music.resume().then(() => {
      Music.playRainAmbience();
      Music.playSynthwave();
    });
    window.removeEventListener('pointerdown', startAudio);
    window.removeEventListener('keydown', startAudio);
  };
  window.addEventListener('pointerdown', startAudio);
  window.addEventListener('keydown', startAudio);

  window.addEventListener('beforeunload', () => game.destroy(true));
} catch (error) {
  // Sin esto, un fallo de arranque deja la pantalla en negro sin explicación.
  const pre = document.getElementById('boot-error');
  if (pre) {
    pre.style.display = 'block';
    pre.textContent = `No se pudo iniciar el juego:\n\n${
      error instanceof Error ? error.stack ?? error.message : String(error)
    }`;
  }
  throw error;
}

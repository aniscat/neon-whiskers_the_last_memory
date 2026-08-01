import Phaser from 'phaser';
import { PALETTE } from '@/core/constants';

export type SurfaceStyle = 'concrete' | 'metal' | 'holo' | 'hazard' | 'wall';

interface StylePalette {
  fill: number;
  edge: number;
  glow: number;
  glowAlpha: number;
}

const STYLES: Record<SurfaceStyle, StylePalette> = {
  concrete: {
    fill: PALETTE.platform,
    edge: PALETTE.platformEdge,
    glow: PALETTE.neonViolet,
    glowAlpha: 0.25,
  },
  metal: { fill: 0x1b2340, edge: 0x3d5187, glow: PALETTE.neonCyan, glowAlpha: 0.35 },
  holo: { fill: 0x1d4a5c, edge: PALETTE.neonCyan, glow: PALETTE.neonCyan, glowAlpha: 0.7 },
  hazard: { fill: 0x3a1024, edge: PALETTE.neonPink, glow: PALETTE.neonPink, glowAlpha: 0.6 },
  wall: { fill: 0x0f1428, edge: 0x24305c, glow: PALETTE.neonViolet, glowAlpha: 0.15 },
};

/**
 * Sustituye a un tileset: dibuja las superficies con Graphics (relleno, borde
 * iluminado, resplandor inferior y grietas deterministas). Si más adelante se
 * añade arte pixel-art real, basta con reemplazar esta clase.
 */
export class PlatformPainter {
  private readonly g: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, depth = -10) {
    this.g = scene.add.graphics().setDepth(depth);
  }

  paint(x: number, y: number, width: number, height: number, style: SurfaceStyle, seed = 0) {
    const p = STYLES[style];
    const g = this.g;

    // Resplandor difuso por debajo, en tres pasadas cada vez más tenues.
    for (let i = 3; i >= 1; i--) {
      g.fillStyle(p.glow, (p.glowAlpha / 3) * (4 - i) * 0.4);
      g.fillRect(x - i, y - i, width + i * 2, height + i * 2);
    }

    g.fillStyle(p.fill, 1);
    g.fillRect(x, y, width, height);

    // Borde superior encendido: es lo que hace legible dónde se puede pisar.
    g.fillStyle(p.edge, 1);
    g.fillRect(x, y, width, 1);
    g.fillStyle(p.glow, p.glowAlpha);
    g.fillRect(x, y + 1, width, 1);

    // Sombra interior en la base.
    g.fillStyle(0x000000, 0.35);
    g.fillRect(x, y + height - 1, width, 1);

    this.detail(x, y, width, height, style, seed);
  }

  /** Texturizado determinista: mismas grietas y remaches en cada recarga. */
  private detail(
    x: number,
    y: number,
    width: number,
    height: number,
    style: SurfaceStyle,
    seed: number,
  ) {
    const rng = new Phaser.Math.RandomDataGenerator([`${style}:${x}:${y}:${seed}`]);
    const g = this.g;

    if (style === 'metal') {
      g.fillStyle(0x000000, 0.4);
      for (let rx = x + 3; rx < x + width - 2; rx += 8) g.fillRect(rx, y + 3, 1, 1);
      return;
    }

    if (style === 'holo') {
      // Franjas de escaneo horizontales.
      g.fillStyle(PALETTE.neonCyan, 0.18);
      for (let sy = y + 2; sy < y + height; sy += 3) g.fillRect(x, sy, width, 1);
      return;
    }

    if (style === 'hazard') {
      g.fillStyle(PALETTE.neonPink, 0.5);
      for (let hx = x; hx < x + width; hx += 6) g.fillRect(hx, y + 2, 3, 1);
      return;
    }

    // concrete / wall: grietas y desconchones.
    const cracks = Math.floor(width / 24);
    g.fillStyle(0x000000, 0.3);
    for (let i = 0; i < cracks; i++) {
      const cx = rng.between(x + 2, x + width - 3);
      const len = rng.between(2, Math.max(2, height - 2));
      g.fillRect(cx, y + 2, 1, len);
    }
  }

  clear() {
    this.g.clear();
  }

  destroy() {
    this.g.destroy();
  }
}

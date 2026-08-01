import Phaser from 'phaser';

/**
 * Marco de UI con estética de terminal: fondo semitransparente, borde de neón y
 * esquinas recortadas. Se usa en diálogos, HUD y visor de fragmentos.
 */
export function drawPanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  accent: number,
  fillAlpha = 0.82,
): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();

  g.fillStyle(0x05060d, fillAlpha).fillRect(x, y, width, height);
  g.lineStyle(1, accent, 0.9).strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);

  // Escuadras en las cuatro esquinas: refuerzan la lectura de "interfaz".
  const c = 5;
  g.lineStyle(1, accent, 1);
  const corners: Array<[number, number, number, number]> = [
    [x, y, c, 0],
    [x, y, 0, c],
    [x + width, y, -c, 0],
    [x + width, y, 0, c],
    [x, y + height, c, 0],
    [x, y + height, 0, -c],
    [x + width, y + height, -c, 0],
    [x + width, y + height, 0, -c],
  ];
  for (const [cx, cy, dx, dy] of corners) {
    g.beginPath();
    g.moveTo(cx, cy);
    g.lineTo(cx + dx, cy + dy);
    g.strokePath();
  }

  return g;
}

/** Barra de progreso simple (vida del núcleo, corrupción, carga del agente). */
export class Meter {
  private readonly g: Phaser.GameObjects.Graphics;
  private value = 0;

  constructor(
    scene: Phaser.Scene,
    private readonly x: number,
    private readonly y: number,
    private readonly width: number,
    private readonly height: number,
    private readonly color: number,
  ) {
    this.g = scene.add.graphics();
    this.redraw();
  }

  setValue(value: number) {
    this.value = Phaser.Math.Clamp(value, 0, 1);
    this.redraw();
  }

  private redraw() {
    this.g
      .clear()
      .fillStyle(0x000000, 0.5)
      .fillRect(this.x, this.y, this.width, this.height)
      .fillStyle(this.color, 0.9)
      .fillRect(this.x, this.y, this.width * this.value, this.height)
      .lineStyle(1, this.color, 0.5)
      .strokeRect(this.x + 0.5, this.y + 0.5, this.width - 1, this.height - 1);
  }

  setScrollFactor(value: number) {
    this.g.setScrollFactor(value);
    return this;
  }

  setDepth(value: number) {
    this.g.setDepth(value);
    return this;
  }

  destroy() {
    this.g.destroy();
  }
}

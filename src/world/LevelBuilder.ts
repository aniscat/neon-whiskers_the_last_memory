import Phaser from 'phaser';
import { GameState } from '@/core/GameState';
import { PALETTE } from '@/core/constants';
import { label } from '@/ui/text';
import { PlatformPainter } from './art/PlatformPainter';
import { MovingPlatform } from './MovingPlatform';
import { Enemy } from '@/entities/Enemy';
import { NpcCat } from '@/entities/NpcCat';
import { HackDoor } from '@/entities/HackDoor';
import { MemoryFragmentPickup } from '@/entities/MemoryFragmentPickup';
import { AbilityPickup } from '@/entities/AbilityPickup';
import { Hazard } from './Hazard';
import { PuzzlePlate } from './PuzzlePlate';
import type { Rect, ZoneDefinition } from './ZoneDefinition';

export interface AmbientSign {
  text: Phaser.GameObjects.Text;
  normal: string;
  corrupted?: string;
}

/** Pista de tutorial que se enciende al acercarse. */
export interface Tip {
  text: Phaser.GameObjects.Text;
  x: number;
  y: number;
  radius: number;
  visible: boolean;
}

export interface BuiltLevel {
  solids: Phaser.Physics.Arcade.StaticGroup;
  movingPlatforms: MovingPlatform[];
  /** Zonas de contacto para escalar paredes; detectan, no colisionan. */
  climbZones: Phaser.GameObjects.Zone[];
  hazards: Hazard[];
  fragments: MemoryFragmentPickup[];
  pickups: AbilityPickup[];
  npcs: NpcCat[];
  enemies: Enemy[];
  doors: HackDoor[];
  plates: PuzzlePlate[];
  exit: Phaser.GameObjects.Zone;
  painter: PlatformPainter;
  signs: AmbientSign[];
  tips: Tip[];
}

const SOLID_TEXTURE = 'fx:solid';

/**
 * Convierte una `ZoneDefinition` en objetos vivos: cuerpos de física invisibles
 * más el dibujo procedural que los representa. Separar los datos de la
 * presentación permite añadir zonas nuevas sin tocar la lógica del juego.
 */
export function buildLevel(scene: Phaser.Scene, def: ZoneDefinition): BuiltLevel {
  ensureSolidTexture(scene);
  scene.physics.world.setBounds(0, 0, def.width, def.height);

  const painter = new PlatformPainter(scene, -10);
  const solids = scene.physics.add.staticGroup();
  const movingPlatforms: MovingPlatform[] = [];
  const climbZones: Phaser.GameObjects.Zone[] = [];

  if (def.floor) {
    addSolid(scene, solids, { x: 0, y: def.height - 16, w: def.width, h: 16 });
    painter.paint(0, def.height - 16, def.width, 16, 'concrete');
  }

  def.platforms.forEach((p, index) => {
    // Las plataformas holográficas solo existen si Nova ya tiene la habilidad.
    if (p.requires && !GameState.has(p.requires)) return;

    if (p.move) {
      const platform = new MovingPlatform(scene, p, SOLID_TEXTURE);
      platform.setDisplaySize(p.w, p.h).setTint(PALETTE.platformEdge);
      movingPlatforms.push(platform);
      return;
    }

    addSolid(scene, solids, p);
    painter.paint(p.x, p.y, p.w, p.h, p.style ?? 'concrete', index);
  });

  for (const w of def.walls) {
    addSolid(scene, solids, w);
    painter.paint(w.x, w.y, w.w, w.h, w.style ?? 'wall');

    // Zona algo más ancha que la pared: así detecta el contacto por ambos lados.
    const detector = scene.add.zone(w.x + w.w / 2, w.y + w.h / 2, w.w + 10, w.h);
    scene.physics.add.existing(detector, true);
    detector.setData('centerX', w.x + w.w / 2);
    climbZones.push(detector);
  }

  const hazards = def.hazards.map((h) => new Hazard(scene, h));
  const plates = def.plates.map((p) => new PuzzlePlate(scene, p));
  const doors = def.doors.map((d) => new HackDoor(scene, d));
  const enemies = def.enemies.map((e) => new Enemy(scene, e));

  const fragments = def.fragments
    .filter((f) => !GameState.fragmentos.has(f.id))
    .map((f) => new MemoryFragmentPickup(scene, f.x, f.y, f.id));

  const pickups = def.pickups
    .filter((p) => !GameState.has(p.ability))
    .map((p) => new AbilityPickup(scene, p.x, p.y, p.ability));

  const npcs = def.npcs
    .filter((n) => !GameState.flags.npcsDisueltos.includes(n.npcId))
    .map((n) => new NpcCat(scene, n.x, n.y, n.npcId));

  const exit = scene.add.zone(
    def.exit.x + def.exit.w / 2,
    def.exit.y + def.exit.h / 2,
    def.exit.w,
    def.exit.h,
  );
  scene.physics.add.existing(exit, true);
  exit.setData('to', def.exit.to);
  drawExit(scene, def.exit);

  const signs: AmbientSign[] = def.signs.map((s) => ({
    text: label(scene, s.x, s.y, s.text, 'micro', '#6f8bd0').setOrigin(0.5).setDepth(-2),
    normal: s.text,
    corrupted: s.corrupted,
  }));

  const tips: Tip[] = def.tips.map((t) => ({
    text: label(scene, t.x, t.y, t.text, 'micro', '#ffb347')
      .setOrigin(0.5)
      .setDepth(30)
      .setAlpha(0),
    x: t.x,
    y: t.y,
    radius: t.radius ?? 100,
    visible: false,
  }));

  return {
    solids,
    movingPlatforms,
    climbZones,
    hazards,
    fragments,
    pickups,
    npcs,
    enemies,
    doors,
    plates,
    exit,
    painter,
    signs,
    tips,
  };
}

function ensureSolidTexture(scene: Phaser.Scene) {
  if (scene.textures.exists(SOLID_TEXTURE)) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0xffffff, 1).fillRect(0, 0, 8, 8);
  g.generateTexture(SOLID_TEXTURE, 8, 8);
  g.destroy();
}

/** Cuerpo estático invisible; lo visible lo dibuja `PlatformPainter`. */
function addSolid(
  scene: Phaser.Scene,
  group: Phaser.Physics.Arcade.StaticGroup,
  rect: Rect & { crumbles?: boolean },
) {
  const body = scene.add
    .rectangle(rect.x + rect.w / 2, rect.y + rect.h / 2, rect.w, rect.h)
    .setVisible(false);
  group.add(body);
  if (rect.crumbles) body.setData('crumbles', true);
  return body;
}

function drawExit(scene: Phaser.Scene, rect: Rect) {
  const portal = scene.add
    .rectangle(rect.x + rect.w / 2, rect.y + rect.h / 2, rect.w, rect.h, PALETTE.neonCyan, 0.18)
    .setDepth(-2)
    .setBlendMode(Phaser.BlendModes.ADD);
  scene.tweens.add({
    targets: portal,
    alpha: { from: 0.1, to: 0.4 },
    duration: 1200,
    yoyo: true,
    repeat: -1,
  });
  label(scene, rect.x + rect.w / 2, rect.y - 8, 'SALIDA', 'micro', '#3fe0d0')
    .setOrigin(0.5)
    .setDepth(-2);
}

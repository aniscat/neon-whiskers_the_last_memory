import Phaser from 'phaser';
import { DEBUG, GAME_HEIGHT, SCENES } from '@/core/constants';
import { GameState } from '@/core/GameState';
import { SaveSystem } from '@/core/SaveSystem';
import { EventBus } from '@/core/EventBus';
import { Player, type PlayerKeys } from '@/entities/Player';
import { NeonCityBackground } from '@/world/art/NeonCityBackground';
import { RainSystem } from '@/world/art/RainSystem';
import { GlitchOverlay } from '@/world/art/GlitchOverlay';
import { buildLevel, type BuiltLevel } from '@/world/LevelBuilder';
import { getZone } from '@/world/zones';
import { ZONES } from '@shared/lore';
import type { ZoneDefinition } from '@/world/ZoneDefinition';
import type { NpcCat } from '@/entities/NpcCat';
import type { HackDoor } from '@/entities/HackDoor';
import type { Emotion, NpcId, ZoneId } from '@shared/types';

const INTERACT_RANGE = 26;

export interface GameSceneData {
  zone: ZoneId;
}

/**
 * Escena genérica de plataformeo. No conoce ninguna zona concreta: recibe una
 * `ZoneDefinition` y la monta. Todo el contenido de las siete zonas vive en
 * `src/world/zones/`.
 */
export class GameScene extends Phaser.Scene {
  private def!: ZoneDefinition;
  private level!: BuiltLevel;
  private player!: Player;
  private background!: NeonCityBackground;
  private rain!: RainSystem;
  private glitch!: GlitchOverlay;
  private holoGroup!: Phaser.Physics.Arcade.StaticGroup;
  private keys!: PlayerKeys;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private nearbyNpc?: NpcCat;
  private nearbyDoor?: HackDoor;
  private dialogueOpen = false;
  private transitioning = false;

  constructor() {
    super(SCENES.game);
  }

  init(data: GameSceneData) {
    const zoneId = data?.zone ?? GameState.zona;
    GameState.enterZone(zoneId);
    this.def = getZone(zoneId);
    this.nearbyNpc = undefined;
    this.nearbyDoor = undefined;
    this.dialogueOpen = false;
    this.transitioning = false;
  }

  create() {
    this.background = new NeonCityBackground(this, this.def.id);
    this.rain = new RainSystem(this);
    this.rain.setIntensity(this.def.rain.intensity);
    this.rain.setInverted(Boolean(this.def.rain.inverted));

    this.level = buildLevel(this, this.def);
    this.holoGroup = this.physics.add.staticGroup();

    this.player = new Player(this, this.def.spawn.x, this.def.spawn.y);
    this.player.setHoloGroup(this.holoGroup);
    this.setupInput();
    this.setupCollisions();
    this.setupCamera();

    this.glitch = new GlitchOverlay(this);
    this.glitch.setIntensity(GameState.corrupcion);

    this.scene.launch(SCENES.hud);
    this.registerBusHandlers();

    if (DEBUG.has('physics')) this.physics.world.createDebugGraphic();

    this.cameras.main.fadeIn(400, 0, 0, 0);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.teardown());
    SaveSystem.save();
  }

  private setupInput() {
    const kb = this.input.keyboard!;
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = {
      left: kb.addKey(K.LEFT),
      right: kb.addKey(K.RIGHT),
      up: kb.addKey(K.UP),
      down: kb.addKey(K.DOWN),
      jump: kb.addKey(K.SPACE),
      dash: kb.addKey(K.SHIFT),
      hack: kb.addKey(K.E),
      gravity: kb.addKey(K.Q),
      holo: kb.addKey(K.F),
      drone: kb.addKey(K.R),
    };
    this.player.bindKeys(this.keys);
    this.interactKey = this.keys.hack;

    kb.on('keydown-ESC', () => {
      if (this.dialogueOpen) return;
      SaveSystem.save();
      this.scene.stop(SCENES.hud);
      this.scene.start(SCENES.menu);
    });

    // La ayuda funciona como pausa: congela a Nova hasta que se cierra.
    kb.on('keydown-H', () => {
      if (this.dialogueOpen) return;
      this.dialogueOpen = true;
      this.player.freeze(true);
      this.scene.launch(SCENES.howToPlay, { overlay: true });
    });
  }

  private setupCollisions() {
    const p = this.player;
    this.physics.add.collider(p, this.level.solids);
    this.physics.add.collider(p, this.holoGroup);
    for (const platform of this.level.movingPlatforms) {
      this.physics.add.collider(p, platform);
    }
    for (const door of this.level.doors) {
      this.physics.add.collider(p, door, undefined, () => !door.isOpen);
    }

    for (const hazard of this.level.hazards) {
      this.physics.add.overlap(p, hazard, () => {
        if (!hazard.isEnabled) return;
        // El dash atraviesa los láseres: es su utilidad de diseño.
        if (hazard.kind === 'laser' && p.state === 'dash') return;
        this.damage(hazard.x);
      });
    }

    for (const enemy of this.level.enemies) {
      this.physics.add.overlap(p, enemy, () => {
        if (GameState.corrupcion > 0.6) return; // los enemigos solo observan
        this.damage(enemy.x);
      });
    }

    for (const fragment of this.level.fragments) {
      this.physics.add.overlap(p, fragment, () => {
        fragment.absorb(p, () => this.collectFragment(fragment.fragmentId));
      });
    }

    for (const pickup of this.level.pickups) {
      this.physics.add.overlap(p, pickup, () => {
        pickup.absorb(p, () => this.grantAbility(pickup.ability));
      });
    }

    for (const plate of this.level.plates) {
      this.physics.add.overlap(p, plate, () => {
        plate.press();
        this.checkPuzzle();
      });
    }

    this.physics.add.overlap(p, this.level.exit, () => this.leaveZone());
  }

  private setupCamera() {
    const cam = this.cameras.main;
    cam.setBounds(0, 0, this.def.width, this.def.height);
    cam.startFollow(this.player, true, 0.12, 0.12);
    cam.setDeadzone(60, 40);
  }

  private registerBusHandlers() {
    const onDialogueClosed = () => {
      this.dialogueOpen = false;
      this.player.freeze(false);
    };
    EventBus.on('dialogue:closed', onDialogueClosed);

    const onDissolve = (npcId: Parameters<typeof GameState.dissolveNpc>[0]) => {
      this.level.npcs.find((n) => n.npcId === npcId)?.dissolve();
    };
    EventBus.on('npc:dissolve', onDissolve);

    const onEmotion = (npcId: NpcId, emotion: Emotion) => {
      this.level.npcs.find((n) => n.npcId === npcId)?.setEmotion(emotion);
    };
    EventBus.on('npc:emotion', onEmotion);

    const onCorruption = (amount: number) => {
      this.glitch.setIntensity(amount);
      this.background.setCorruption(amount);
      // "La lluvia cae hacia arriba."
      this.rain.setInverted(Boolean(this.def.rain.inverted) || amount > 0.55);
      this.refreshSigns(amount);
    };
    EventBus.on('corruption:changed', onCorruption);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      EventBus.off('dialogue:closed', onDialogueClosed);
      EventBus.off('npc:dissolve', onDissolve);
      EventBus.off('npc:emotion', onEmotion);
      EventBus.off('corruption:changed', onCorruption);
    });
  }

  /** "Los carteles muestran mensajes distintos." */
  private refreshSigns(corruption: number) {
    for (const sign of this.level.signs) {
      const showCorrupted = sign.corrupted && corruption > 0.4 && Math.random() < corruption;
      sign.text.setText(showCorrupted ? sign.corrupted! : sign.normal);
    }
  }

  override update(time: number, _delta: number) {
    GameState.tiempo += _delta / 1000;

    this.background.update(this.cameras.main.scrollX, this.cameras.main.scrollY);
    this.glitch.update(time);

    for (const hazard of this.level.hazards) hazard.refresh(time);
    for (const plate of this.level.plates) plate.refresh();

    if (this.dialogueOpen) return;

    this.carryOnPlatform();
    this.updateWallContact();
    this.updateProximity();
    this.updateTips();
    this.checkFall();
  }

  /** Enciende las pistas de tutorial cuando Nova se acerca y las apaga al salir. */
  private updateTips() {
    for (const tip of this.level.tips) {
      const near =
        Phaser.Math.Distance.Between(this.player.x, this.player.y, tip.x, tip.y) < tip.radius;
      if (near === tip.visible) continue;

      tip.visible = near;
      this.tweens.add({ targets: tip.text, alpha: near ? 1 : 0, duration: 260 });
    }
  }

  /** Arrastra a Nova con la plataforma móvil sobre la que va montada. */
  private carryOnPlatform() {
    if (!this.player.onGround) return;

    for (const platform of this.level.movingPlatforms) {
      const body = platform.body as Phaser.Physics.Arcade.Body;
      const overlapX = Math.abs(this.player.x - platform.x) < body.width / 2 + 8;
      const onTop = Math.abs(this.player.body!.bottom - body.top) < 6;
      if (overlapX && onTop) {
        this.player.x += platform.deltaX;
        this.player.y += platform.deltaY;
      }
    }
  }

  /** Detecta si Nova está pegada a una pared escalable y por qué lado. */
  private updateWallContact() {
    let side: -1 | 0 | 1 = 0;
    for (const detector of this.level.climbZones) {
      const bounds = detector.getBounds();
      if (!Phaser.Geom.Rectangle.Overlaps(bounds, this.player.getBounds())) continue;
      const centerX = detector.getData('centerX') as number;
      side = this.player.x < centerX ? -1 : 1;
      break;
    }
    this.player.setWallContact(side);
  }

  /** Marca el NPC o la puerta más cercanos y atiende la tecla de interacción. */
  private updateProximity() {
    this.nearbyNpc = undefined;
    for (const npc of this.level.npcs) {
      const near =
        Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y) < INTERACT_RANGE;
      npc.setNearby(near);
      if (near) this.nearbyNpc = npc;
    }

    this.nearbyDoor = undefined;
    for (const door of this.level.doors) {
      const near =
        !door.isOpen &&
        Phaser.Math.Distance.Between(this.player.x, this.player.y, door.x, door.y) <
          INTERACT_RANGE;
      door.setNearby(near);
      if (near) this.nearbyDoor = door;
    }

    if (!Phaser.Input.Keyboard.JustDown(this.interactKey)) return;
    if (this.nearbyNpc) {
      this.openDialogue(this.nearbyNpc);
      return;
    }
    this.nearbyDoor?.tryOpen();
  }

  private openDialogue(npc: NpcCat) {
    this.dialogueOpen = true;
    this.player.freeze(true);
    this.scene.launch(SCENES.dialogue, { npcId: npc.npcId });
  }

  /** Caer fuera del mundo mata igual que un peligro. */
  private checkFall() {
    if (this.player.y < this.def.height + GAME_HEIGHT) return;
    this.damage(this.player.x, true);
  }

  private damage(fromX: number, fatal = false) {
    if (fatal) {
      this.respawn();
      return;
    }
    this.player.hurt(fromX);
  }

  private respawn() {
    EventBus.emit('player:died');
    this.cameras.main.flash(200, 255, 47, 109);
    this.player.setPosition(this.def.spawn.x, this.def.spawn.y);
    this.player.setVelocity(0, 0);
    this.player.flipped = false;
  }

  private collectFragment(id: string) {
    if (!GameState.collectFragment(id)) return;
    this.dialogueOpen = true;
    this.player.freeze(true);
    this.scene.launch(SCENES.fragment, { fragmentId: id });
  }

  private grantAbility(ability: Parameters<typeof GameState.grantAbility>[0]) {
    if (!GameState.grantAbility(ability)) return;
    SaveSystem.save();
  }

  /** El acertijo se resuelve cuando todas las placas de un grupo están activas. */
  private checkPuzzle() {
    if (GameState.flags.acertijosResueltos.includes(this.def.id)) return;

    const groups = new Map<string, boolean>();
    for (const plate of this.level.plates) {
      const current = groups.get(plate.group);
      groups.set(plate.group, (current ?? true) && plate.isActive);
    }
    const solved = [...groups.values()].some(Boolean) && groups.size > 0;
    if (!solved) return;

    GameState.solvePuzzle(this.def.id);
    EventBus.emit('toast', `${ZONES[this.def.id].nombre.toUpperCase()}: MECANISMO LIBERADO`);
    for (const door of this.level.doors) {
      if (door.opensWith === 'puzzle') door.tryOpen();
    }
    SaveSystem.save();
  }

  private leaveZone() {
    if (this.transitioning) return;
    this.transitioning = true;

    const to = this.level.exit.getData('to') as ZoneId;
    EventBus.emit('zone:completed', this.def.id);
    SaveSystem.save();

    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.stop(SCENES.hud);
      if (to === 'tower') {
        GameState.enterZone('tower');
        this.scene.start(SCENES.boss);
        return;
      }
      this.scene.start(SCENES.game, { zone: to });
    });
  }

  private teardown() {
    this.background.destroy();
    this.rain.destroy();
    this.glitch.destroy();
    this.level.painter.destroy();
    this.input.keyboard?.removeAllListeners();
  }
}

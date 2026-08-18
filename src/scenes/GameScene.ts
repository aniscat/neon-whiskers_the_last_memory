import Phaser from 'phaser';
import { applyRenderScale } from '@/core/renderScale';
import { DEBUG, SCENES } from '@/core/constants';
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
  /** Último punto firme; ahí reaparece Nova en vez de al inicio del nivel. */
  private checkpoint = new Phaser.Math.Vector2();
  private lastCheckpointAt = 0;
  /** Evita disparar la muerte por caída varias veces en el mismo descenso. */
  private falling = false;
  /** Muertes seguidas: si se acumulan, el checkpoint es una trampa y se descarta. */
  private recentDeaths = 0;
  private lastDeathAt = 0;
  /** Puntos de retorno derivados del nivel: solo superficies estáticas y seguras. */
  private safeSpots: Phaser.Math.Vector2[] = [];
  /** true si Nova va montada en una plataforma móvil (no se guarda checkpoint). */
  private riding = false;
  /** Instante hasta el que NO se puede morir de ningún modo tras un respawn. */
  private respawnImmunityUntil = 0;

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
    this.falling = false;
    this.riding = false;
    this.recentDeaths = 0;
    this.lastDeathAt = 0;
    this.lastCheckpointAt = 0;
    this.respawnImmunityUntil = 0;
    this.checkpoint.set(this.def.spawn.x, this.def.spawn.y);
    // Cada zona empieza con el collar entero.
    GameState.restoreIntegrity();
  }

  create() {
    applyRenderScale(this);
    this.background = new NeonCityBackground(this, this.def.id);
    this.rain = new RainSystem(this);
    this.rain.setIntensity(this.def.rain.intensity);
    this.rain.setInverted(Boolean(this.def.rain.inverted));

    this.level = buildLevel(this, this.def);
    this.holoGroup = this.physics.add.staticGroup();
    // Necesita los peligros ya construidos para descartar los puntos expuestos.
    this.buildSafeSpots();

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
        // El agua y las púas devuelven a Nova de inmediato: quedarse de pie sobre
        // unos pinchos recibiendo golpes uno a uno se sentía roto. Las prensas y
        // los láseres sí son solo daño, porque se pueden atravesar y esquivar.
        const mortal = hazard.kind === 'water' || hazard.kind === 'spike';
        this.damage(hazard.x, mortal);
      });
    }

    for (const enemy of this.level.enemies) {
      // Los gatos de pandilla tienen gravedad: sin esto atravesaban el suelo y
      // desaparecían del nivel al empezar.
      if (enemy.kind === 'gang') {
        this.physics.add.collider(enemy, this.level.solids);
      }
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
      const npc = this.level.npcs.find((n) => n.npcId === npcId);
      if (!npc) return;
      // Sacarlo de la lista antes de destruirlo: `updateProximity` lo recorre en
      // cada frame y tocaría un objeto ya destruido.
      this.level.npcs = this.level.npcs.filter((n) => n !== npc);
      npc.dissolve();
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
    this.updateCheckpoint(time);
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
    this.riding = false;
    if (!this.player.onGround) return;

    for (const platform of this.level.movingPlatforms) {
      const body = platform.body as Phaser.Physics.Arcade.Body;
      const overlapX = Math.abs(this.player.x - platform.x) < body.width / 2 + 8;
      const onTop = Math.abs(this.player.body!.bottom - body.top) < 6;
      if (overlapX && onTop) {
        this.player.x += platform.deltaX;
        this.player.y += platform.deltaY;
        this.riding = true;
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

  /**
   * Caer por debajo del mundo es mortal: resta integridad y reconstruye a Nova en
   * el último punto seguro. Antes esto no ocurría nunca porque el jugador chocaba
   * con el borde inferior del mundo y se quedaba atrapado ahí.
   */
  private checkFall() {
    if (this.falling || this.player.y < this.def.height + 40) return;
    if (this.time.now < this.respawnImmunityUntil) return;
    this.falling = true;
    this.damage(this.player.x, true);
  }

  /**
   * Calcula de antemano los puntos de retorno válidos a partir de la definición de
   * la zona: solo encima de plataformas ESTÁTICAS y del suelo, y lejos de peligros.
   *
   * Derivarlos del nivel en vez de la posición observada del jugador es lo que
   * evita los dos bucles de muerte que aparecieron: reaparecer sobre las púas del
   * nivel 1 (que se apoyan en el suelo, así que "estar en el suelo" no bastaba) y
   * reaparecer en el aire en el nivel 2, donde el punto guardado era una plataforma
   * móvil que ya se había marchado.
   */
  private buildSafeSpots() {
    this.safeSpots = [];

    // El cuerpo mide 14 px y su base está en `y + 14`; 15 lo deja justo encima.
    const add = (x: number, surfaceTop: number) => {
      const y = surfaceTop - 15;
      if (this.isSafeSpot(x, y)) this.safeSpots.push(new Phaser.Math.Vector2(x, y));
    };

    if (this.def.floor) {
      for (let x = 30; x < this.def.width; x += 100) add(x, this.def.height - 16);
    }

    for (const p of this.def.platforms) {
      // Las móviles no sirven: no están donde estaban al guardar el punto.
      if (p.move) continue;
      const puntos = Math.max(1, Math.round(p.w / 90));
      for (let i = 0; i < puntos; i++) add(p.x + (p.w * (i + 0.5)) / puntos, p.y);
    }
  }

  /** Punto de retorno válido más cercano, o undefined si no hay ninguno en rango. */
  private nearestSafeSpot(x: number, y: number, radius: number) {
    let mejor: Phaser.Math.Vector2 | undefined;
    let mejorDist = radius;

    for (const spot of this.safeSpots) {
      const d = Phaser.Math.Distance.Between(x, y, spot.x, spot.y);
      if (d < mejorDist) {
        mejorDist = d;
        mejor = spot;
      }
    }
    return mejor;
  }

  /**
   * Fija el checkpoint al punto de retorno válido más próximo mientras Nova esté
   * quieta en el suelo. Nunca guarda su posición exacta.
   */
  private updateCheckpoint(time: number) {
    if (time - this.lastCheckpointAt < 400) return;
    if (!this.player.onGround || this.riding || this.player.flipped) return;
    if (Math.abs(this.player.body!.velocity.y) > 10) return;

    const spot = this.nearestSafeSpot(this.player.x, this.player.y, 70);
    if (!spot) return;

    this.lastCheckpointAt = time;
    this.checkpoint.copy(spot);
  }

  /** ¿Este punto está lejos de todo peligro? Con margen, para no reaparecer pegado. */
  private isSafeSpot(x: number, y: number) {
    const margin = 20;
    const zona = new Phaser.Geom.Rectangle(x - 10, y - 16, 20, 30);

    for (const hazard of this.level.hazards) {
      // Los peligros cíclicos cuentan aunque ahora estén apagados: volverán.
      const b = hazard.getBounds();
      const inflado = new Phaser.Geom.Rectangle(
        b.x - margin,
        b.y - margin,
        b.width + margin * 2,
        b.height + margin * 2,
      );
      if (Phaser.Geom.Rectangle.Overlaps(inflado, zona)) return false;
    }
    return true;
  }

  private damage(fromX: number, fatal = false) {
    // Inmunidad absoluta tras un respawn: ni los peligros mortales ni la caída
    // pueden matar a Nova hasta que se agote la ventana. Es la salvaguarda
    // definitiva contra el bucle de muerte en zonas sin suelo.
    if (this.time.now < this.respawnImmunityUntil) return;
    if (!fatal && this.player.isInvulnerable) return;

    const sinIntegridad = GameState.damage(fatal ? 2 : 1);
    if (fatal || sinIntegridad) {
      this.respawn(sinIntegridad);
      return;
    }
    this.player.hurt(fromX);
  }

  /** `reconstruida` indica que la integridad llegó a cero y se restaura entera. */
  private respawn(reconstruida: boolean) {
    EventBus.emit('player:died');
    // Sin esta comprobación, varias muertes seguidas reiniciaban el flash una y
    // otra vez y la pantalla se quedaba permanentemente roja.
    const cam = this.cameras.main;
    if (!cam.flashEffect.isRunning) {
      cam.flash(200, 255, 47, 109);
      cam.shake(180, 0.008);
    }

    const destino = this.chooseRespawnPoint();
    // `body.reset` reposiciona sprite + cuerpo y limpia los flags de colisión
    // del frame anterior. Sin esto el motor puede conservar un overlap caduco
    // que dispara un daño inmediato al reaparecer y genera un bucle de muerte.
    (this.player.body as Phaser.Physics.Arcade.Body).reset(destino.x, destino.y);
    this.player.flipped = false;
    this.player.revive();
    // Inmunidad absoluta durante 1.5 s: corta cualquier bucle de muerte de raíz.
    this.respawnImmunityUntil = this.time.now + 1500;
    this.player.grantGrace(1500);
    this.falling = false;

    if (reconstruida) {
      GameState.restoreIntegrity();
      EventBus.emit('toast', 'COLLAR RECONSTRUIDO');
    }
    EventBus.emit('player:respawned');
    SaveSystem.save();
  }

  /**
   * Elige dónde reaparecer, con dos salvaguardas contra los bucles de muerte:
   * si el checkpoint dejó de ser seguro se descarta, y si Nova muere varias veces
   * seguidas en pocos segundos se la devuelve al inicio de la zona.
   */
  private chooseRespawnPoint(): Phaser.Math.Vector2 {
    const ahora = this.time.now;
    this.recentDeaths = ahora - this.lastDeathAt < 3000 ? this.recentDeaths + 1 : 1;
    this.lastDeathAt = ahora;

    const seguro = this.isSafeSpot(this.checkpoint.x, this.checkpoint.y);
    if (this.recentDeaths >= 3 || !seguro) {
      this.recentDeaths = 0;
      // Al inicio de la zona, pero apoyada en una superficie estática de verdad.
      const inicio =
        this.nearestSafeSpot(this.def.spawn.x, this.def.spawn.y, 260) ??
        new Phaser.Math.Vector2(this.def.spawn.x, this.def.spawn.y);
      this.checkpoint.copy(inicio);
      EventBus.emit('toast', 'VOLVIENDO AL INICIO DEL SECTOR');
    }
    return this.checkpoint;
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

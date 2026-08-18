import { describe, expect, it } from 'vitest';
import {
  DOUBLE_JUMP_HEIGHT,
  DOUBLE_JUMP_REACH,
  GRAVITY,
  JUMP_HEIGHT,
  JUMP_REACH,
  RUN_SPEED,
} from '../src/core/physics';
import { ZONE_DEFINITIONS } from '../src/world/zones';
import { ZONES, ZONE_ORDER } from '../shared/lore';
import type { ZoneDefinition } from '../src/world/ZoneDefinition';
import type { AbilityId, ZoneId } from '../shared/types';

/**
 * Estas pruebas existen por un bug real: la primera plataforma de la zona 1
 * exigía subir 54 px cuando el salto solo alcanzaba 46,7 px, así que el nivel era
 * imposible de superar. Comprobar la geometría contra la física evita repetirlo.
 */

interface Surface {
  /** Coordenada Y de la cara superior (donde se pisa). */
  top: number;
  left: number;
  right: number;
  /** Si está definido, solo se llega usando esta habilidad. */
  reachedWith?: AbilityId;
  /** Las paredes se suben escalando, no saltando a su borde superior. */
  isWall?: boolean;
}

/** Todas las superficies pisables de una zona: suelo, plataformas y paredes. */
function surfaces(def: ZoneDefinition): Surface[] {
  const list: Surface[] = [];

  if (def.floor) list.push({ top: def.height - 16, left: 0, right: def.width });

  for (const p of def.platforms) {
    // Las móviles se pisan a lo largo de todo su recorrido.
    const dx = p.move?.dx ?? 0;
    const dy = p.move?.dy ?? 0;
    list.push({
      top: p.y + Math.min(0, dy),
      left: p.x + Math.min(0, dx),
      right: p.x + p.w + Math.max(0, dx),
      reachedWith: p.reachedWith,
    });
  }
  for (const w of def.walls) {
    list.push({ top: w.y, left: w.x, right: w.x + w.w, isWall: true });
  }

  return list;
}

/** Habilidades que Nova ya tiene al llegar a una zona, contando la que da la zona. */
function abilitiesAvailableAt(id: ZoneId): AbilityId[] {
  const index = ZONE_ORDER.indexOf(id);
  return ZONE_ORDER.slice(0, index + 1)
    .map((z) => ZONES[z].otorga)
    .filter((a): a is AbilityId => a !== null);
}

/** Separación horizontal entre dos superficies; 0 si se solapan. */
function horizontalGap(a: Surface, b: Surface) {
  if (a.right >= b.left && b.right >= a.left) return 0;
  return a.right < b.left ? b.left - a.right : a.left - b.right;
}

/**
 * Deriva horizontal que se puede cubrir cayendo una altura `drop`.
 * t = √(2·d / g)  y  deriva = velocidad · t.
 *
 * Sin esto, la comprobación daba por buena cualquier superficie que tuviera otra
 * más alta en cualquier parte del nivel, y así se colaron huecos de 200 px.
 */
function fallDrift(drop: number) {
  const t = Math.sqrt((2 * Math.abs(drop)) / GRAVITY);
  return RUN_SPEED * t;
}

/** ¿Se puede pasar de `from` a `target` con un doble salto o cayendo? */
function canTravel(from: Surface, target: Surface) {
  const subida = from.top - target.top;
  const gap = horizontalGap(from, target);

  // Caída: se puede derivar en el aire, pero no cruzar un vano cualquiera.
  if (subida < 0) return gap <= fallDrift(subida) + JUMP_REACH;

  if (subida > DOUBLE_JUMP_HEIGHT) return false;
  return gap <= DOUBLE_JUMP_REACH;
}

const playable = ZONE_ORDER.filter((z) => z !== 'tower') as ZoneId[];

describe('física del salto', () => {
  it('las cotas derivadas son las esperadas', () => {
    expect(Math.round(JUMP_HEIGHT)).toBe(61);
    expect(Math.round(JUMP_REACH)).toBe(95);
    expect(Math.round(DOUBLE_JUMP_HEIGHT)).toBe(121);
    expect(Math.round(DOUBLE_JUMP_REACH)).toBe(143);
  });
});

describe('alcanzabilidad de las plataformas', () => {
  it.each(playable)('en %s toda superficie tiene otra desde la que llegar', (id) => {
    const def = ZONE_DEFINITIONS[id];
    const all = surfaces(def);

    const inalcanzables = all
      // Las que declaran `reachedWith` se comprueban en la prueba siguiente.
      .filter((target) => !target.reachedWith)
      .filter((target) => {
        if (all.some((from) => from !== target && canTravel(from, target))) return false;
        // El borde alto de una pared no se alcanza saltando: se sube escalándola.
        if (target.isWall && abilitiesAvailableAt(id).includes('wallClimb')) return false;
        return true;
      });

    expect(
      inalcanzables.map((s) => `y=${s.top} x=${s.left}..${s.right}`),
      `superficies inalcanzables en ${id}`,
    ).toEqual([]);
  });

  /**
   * Una plataforma móvil tiene que poder abordarse esperando a que pase por su
   * punto más cómodo, con un salto normal. En z2 el primer salto del nivel era a
   * una que oscilaba 70 px: cuando estaba arriba pedía un doble salto con timing
   * exacto y parecía que el salto estaba roto.
   */
  it.each(playable)('en %s las plataformas móviles se abordan con un salto simple', (id) => {
    const def = ZONE_DEFINITIONS[id];
    const all = surfaces(def);

    const inabordables = def.platforms
      .filter((p) => p.move)
      .filter((p) => {
        // Su posición más fácil: la más baja de todo el recorrido.
        const lowest: Surface = {
          top: p.y + Math.max(0, p.move!.dy ?? 0),
          left: p.x + Math.min(0, p.move!.dx ?? 0),
          right: p.x + p.w + Math.max(0, p.move!.dx ?? 0),
        };

        return !all.some((from) => {
          if (from.left === lowest.left && from.top === lowest.top) return false;
          const subida = from.top - lowest.top;
          if (subida < 0) return horizontalGap(from, lowest) <= fallDrift(subida) + JUMP_REACH;
          return subida <= JUMP_HEIGHT && horizontalGap(from, lowest) <= JUMP_REACH;
        });
      });

    expect(
      inabordables.map((p) => `x=${p.x} y=${p.y}`),
      `plataformas móviles inabordables con un salto en ${id}`,
    ).toEqual([]);
  });

  it.each(playable)(
    'en %s las superficies que exigen una habilidad ya la tienen disponible',
    (id) => {
      const disponibles = abilitiesAvailableAt(id);
      for (const p of ZONE_DEFINITIONS[id].platforms) {
        if (!p.reachedWith) continue;
        expect(disponibles, `${id} x=${p.x} exige ${p.reachedWith}`).toContain(p.reachedWith);
      }
    },
  );

  it('la zona 1 es superable con salto simple hasta recoger el doble salto', () => {
    const def = ZONE_DEFINITIONS.z1;
    const pickup = def.pickups.find((p) => p.ability === 'doubleJump');
    expect(pickup, 'la zona 1 entrega el doble salto').toBeDefined();

    // Todo lo que hay antes del módulo debe poder subirse de un solo salto.
    const antes = surfaces(def).filter((s) => s.left <= pickup!.x + 40);
    for (const target of antes) {
      const alcanzable = antes.some((from) => {
        if (from === target) return false;
        const subida = from.top - target.top;
        return subida >= 0 && subida <= JUMP_HEIGHT && horizontalGap(from, target) <= JUMP_REACH;
      });
      // El suelo es el punto de partida, no necesita nada debajo.
      if (target.top === def.height - 16) continue;
      expect(alcanzable, `y=${target.top} x=${target.left} antes del doble salto`).toBe(true);
    }
  });
});

describe('salidas y aparición', () => {
  it.each(playable)('en %s la salida está sobre una superficie alcanzable', (id) => {
    const def = ZONE_DEFINITIONS[id];
    const all = surfaces(def);
    const exitBottom = def.exit.y + def.exit.h;

    // Debe haber una superficie donde apoyarse para tocar la salida.
    const apoyo = all.some(
      (s) =>
        Math.abs(s.top - exitBottom) < 24 &&
        s.left - JUMP_REACH <= def.exit.x &&
        s.right + JUMP_REACH >= def.exit.x + def.exit.w,
    );
    expect(apoyo, `la salida de ${id} no tiene suelo debajo`).toBe(true);
  });

  /**
   * En el nivel 1 las púas se apoyan encima del suelo, y el punto de reaparición se
   * guardaba ahí porque técnicamente era "suelo": reaparecías sobre los pinchos y
   * morías en bucle. Un spawn dentro de un peligro provocaría lo mismo.
   */
  it.each(playable)('en %s el punto de aparición no está dentro de un peligro', (id) => {
    const def = ZONE_DEFINITIONS[id];
    const margin = 20;

    const peligrosos = def.hazards.filter(
      (h) =>
        def.spawn.x + 10 > h.x - margin &&
        def.spawn.x - 10 < h.x + h.w + margin &&
        def.spawn.y + 14 > h.y - margin &&
        def.spawn.y - 16 < h.y + h.h + margin,
    );

    expect(
      peligrosos.map((h) => `${h.kind} en x=${h.x} y=${h.y}`),
      `el spawn de ${id} está dentro de un peligro`,
    ).toEqual([]);
  });

  it.each(playable)('en %s Nova aparece sobre suelo firme', (id) => {
    const def = ZONE_DEFINITIONS[id];
    const all = surfaces(def);
    const apoyo = all.some(
      (s) => s.top >= def.spawn.y && s.top - def.spawn.y < 120 && s.left <= def.spawn.x && s.right >= def.spawn.x,
    );
    expect(apoyo, `el spawn de ${id} está en el vacío`).toBe(true);
  });
});

describe('tutorial', () => {
  it('la zona 1 enseña moverse, saltar, el doble salto y hablar', () => {
    const textos = ZONE_DEFINITIONS.z1.tips.map((t) => t.text.toLowerCase()).join(' | ');
    for (const concepto of ['mover', 'saltar', 'doble salto', 'hablar']) {
      expect(textos, `falta la pista de "${concepto}"`).toContain(concepto);
    }
  });

  it('las pistas de tutorial caen dentro de los límites de su zona', () => {
    for (const id of playable) {
      const def = ZONE_DEFINITIONS[id];
      for (const tip of def.tips) {
        expect(tip.x, `${id} tip.x`).toBeGreaterThanOrEqual(0);
        expect(tip.x, `${id} tip.x`).toBeLessThanOrEqual(def.width);
        expect(tip.y, `${id} tip.y`).toBeLessThanOrEqual(def.height);
      }
    }
  });
});

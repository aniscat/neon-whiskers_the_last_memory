import { describe, expect, it } from 'vitest';
import {
  DOUBLE_JUMP_HEIGHT,
  DOUBLE_JUMP_REACH,
  JUMP_HEIGHT,
  JUMP_REACH,
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
  for (const w of def.walls) list.push({ top: w.y, left: w.x, right: w.x + w.w });

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
      .filter((target) =>
        // Una superficie es alcanzable si existe otra más baja (o a la misma altura)
        // dentro del alcance de un doble salto, en vertical y en horizontal.
        !all.some((from) => {
          if (from === target) return false;
          const subida = from.top - target.top;
          if (subida < 0) return true; // se puede caer desde arriba
          if (subida > DOUBLE_JUMP_HEIGHT) return false;
          return horizontalGap(from, target) <= DOUBLE_JUMP_REACH;
        }),
      );

    expect(
      inalcanzables.map((s) => `y=${s.top} x=${s.left}..${s.right}`),
      `superficies inalcanzables en ${id}`,
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

import { describe, expect, it } from 'vitest';
import { HINTS, MEMORY_FRAGMENTS, ZONES, ZONE_ORDER, fragmentsOfZone } from '../shared/lore';
import { NPCS } from '../shared/npcs';
import { ZONE_DEFINITIONS } from '../src/world/zones';
import type { ZoneId } from '../shared/types';

/**
 * El agente solo puede hablar de lo que existe en el lore, y los niveles solo
 * pueden colocar fragmentos que existan. Estas comprobaciones evitan que un
 * descuido de contenido se convierta en un fragmento inalcanzable.
 */
describe('coherencia del lore', () => {
  it('no hay ids de fragmento repetidos', () => {
    const ids = MEMORY_FRAGMENTS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('todos los fragmentos pertenecen a una zona existente', () => {
    for (const fragment of MEMORY_FRAGMENTS) {
      expect(ZONES[fragment.zona], fragment.id).toBeDefined();
    }
  });

  it('cada zona jugable tiene al menos un fragmento y pistas', () => {
    for (const id of ZONE_ORDER.filter((z) => z !== 'tower')) {
      expect(fragmentsOfZone(id).length, id).toBeGreaterThan(0);
      expect(HINTS[id].length, id).toBeGreaterThan(0);
    }
  });

  it('cada zona jugable tiene un NPC distinto asignado', () => {
    const npcs = ZONE_ORDER.map((id) => ZONES[id].npc);
    expect(new Set(npcs).size).toBe(npcs.length);
  });

  it('el NPC de cada zona declara la misma zona en su ficha', () => {
    for (const id of ZONE_ORDER) {
      expect(NPCS[ZONES[id].npc].zona, id).toBe(id);
    }
  });

  it('las habilidades se reparten una por zona jugable', () => {
    const playableCount = ZONE_ORDER.filter((z) => z !== 'tower').length;
    const otorgadas = ZONE_ORDER.map((id) => ZONES[id].otorga).filter(Boolean);
    expect(otorgadas.length).toBe(playableCount);
    expect(new Set(otorgadas).size).toBe(otorgadas.length);
  });
});

describe('coherencia de los niveles', () => {
  const playable = ZONE_ORDER.filter((z) => z !== 'tower') as ZoneId[];

  it('cada zona jugable tiene definición de nivel', () => {
    for (const id of playable) expect(ZONE_DEFINITIONS[id], id).toBeDefined();
  });

  it('los fragmentos colocados en los niveles existen en el lore', () => {
    for (const id of playable) {
      for (const fragment of ZONE_DEFINITIONS[id].fragments) {
        expect(MEMORY_FRAGMENTS.some((f) => f.id === fragment.id), `${id}/${fragment.id}`).toBe(
          true,
        );
      }
    }
  });

  it('cada nivel coloca la habilidad que su zona promete', () => {
    for (const id of playable) {
      const esperada = ZONES[id].otorga;
      const colocadas = ZONE_DEFINITIONS[id].pickups.map((p) => p.ability);
      expect(colocadas, id).toContain(esperada);
    }
  });

  it('las salidas encadenan las zonas en orden y terminan en la torre', () => {
    for (let i = 0; i < playable.length; i++) {
      const siguiente = i + 1 < playable.length ? playable[i + 1] : 'tower';
      expect(ZONE_DEFINITIONS[playable[i]].exit.to, playable[i]).toBe(siguiente);
    }
  });

  it('el punto de aparición y la salida caen dentro de los límites del nivel', () => {
    for (const id of playable) {
      const def = ZONE_DEFINITIONS[id];
      expect(def.spawn.x, `${id} spawn.x`).toBeGreaterThanOrEqual(0);
      expect(def.spawn.x, `${id} spawn.x`).toBeLessThan(def.width);
      expect(def.spawn.y, `${id} spawn.y`).toBeLessThan(def.height);
      expect(def.exit.x + def.exit.w, `${id} exit`).toBeLessThanOrEqual(def.width);
    }
  });

  it('los NPC colocados coinciden con el NPC canónico de la zona', () => {
    for (const id of playable) {
      const ids = ZONE_DEFINITIONS[id].npcs.map((n) => n.npcId);
      expect(ids, id).toContain(ZONES[id].npc);
    }
  });

  it('cada acertijo tiene al menos dos placas del mismo grupo', () => {
    for (const id of playable) {
      const grupos = new Map<string, number>();
      for (const plate of ZONE_DEFINITIONS[id].plates) {
        grupos.set(plate.group, (grupos.get(plate.group) ?? 0) + 1);
      }
      expect(grupos.size, `${id} tiene grupos de placas`).toBeGreaterThan(0);
      for (const [grupo, total] of grupos) {
        expect(total, `${id}/${grupo}`).toBeGreaterThanOrEqual(2);
      }
    }
  });
});

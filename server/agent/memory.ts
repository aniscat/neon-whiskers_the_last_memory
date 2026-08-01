import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NpcId } from '../../shared/types';

const FILE = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '.data',
  'conversations.json',
);

const MAX_PER_NPC = 12;

type Store = Partial<Record<NpcId, string[]>>;

/**
 * Memoria de conversación por NPC. Es lo que permite que un gato recuerde de qué
 * habló con Nova la última vez (y que NADIE, el gato del olvido, sea el único que
 * no lo haga: su prompt le prohíbe usar esta herramienta).
 *
 * Se persiste en disco de forma perezosa; si el disco es de solo lectura, sigue
 * funcionando en memoria.
 */
export class ConversationMemory {
  private store: Store = {};
  private dirty = false;
  private loaded = false;

  async load() {
    if (this.loaded) return;
    this.loaded = true;
    try {
      this.store = JSON.parse(await readFile(FILE, 'utf8')) as Store;
    } catch {
      this.store = {};
    }
  }

  get(npcId: NpcId): string[] {
    return this.store[npcId] ?? [];
  }

  add(npcId: NpcId, resumen: string) {
    const list = this.store[npcId] ?? [];
    list.push(resumen);
    // Solo interesa el pasado reciente: recortamos por la cabeza.
    this.store[npcId] = list.slice(-MAX_PER_NPC);
    this.dirty = true;
  }

  async flush() {
    if (!this.dirty) return;
    this.dirty = false;
    try {
      await mkdir(dirname(FILE), { recursive: true });
      await writeFile(FILE, JSON.stringify(this.store, null, 2), 'utf8');
    } catch (error) {
      console.warn('[memory] no se pudo persistir la memoria de conversación:', error);
    }
  }

  /** Usado por los tests y por el endpoint de reinicio. */
  reset() {
    this.store = {};
    this.dirty = true;
  }
}

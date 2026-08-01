import { GameState, SAVE_VERSION, type SerializedState } from './GameState';

const KEY = 'neon-whiskers:save:v1';

/**
 * Persistencia en localStorage. Deliberadamente tolerante a fallos: una partida
 * corrupta o un navegador sin almacenamiento no debe impedir jugar.
 */
export const SaveSystem = {
  save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(GameState.serialize()));
      return true;
    } catch {
      return false;
    }
  },

  read(): SerializedState | null {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const data = JSON.parse(raw) as SerializedState;
      if (data.version !== SAVE_VERSION) return null;
      return data;
    } catch {
      return null;
    }
  },

  exists() {
    return this.read() !== null;
  },

  load() {
    const data = this.read();
    if (!data) return false;
    GameState.load(data);
    return true;
  },

  clear() {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* sin almacenamiento: nada que borrar */
    }
  },
};

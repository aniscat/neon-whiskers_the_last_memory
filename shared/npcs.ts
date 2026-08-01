/**
 * Ficha de presentación de cada gato NPC. El servidor añade el prompt de
 * personalidad en `server/agent/personas.ts`; aquí solo va lo que el cliente
 * necesita para dibujarlos.
 */
import type { Emotion, NpcId, ZoneId } from './types';

export interface NpcInfo {
  id: NpcId;
  /** Nombre que ve el jugador. */
  nombre: string;
  /** Variante de sprite en `public/assets/cats/<sprite>/`. */
  sprite: string;
  zona: ZoneId;
  /** Emoción humana que este gato encarna. */
  emocion: Emotion;
  /** Color de acento para el marco de diálogo y el aura de neón. */
  color: number;
  /** Primera línea, escrita a mano: el agente toma el relevo después. */
  saludo: string;
}

export const NPCS: Record<NpcId, NpcInfo> = {
  duelo: {
    id: 'duelo',
    nombre: 'ÓXIDO',
    sprite: 'black',
    zona: 'z1',
    emocion: 'duelo',
    color: 0x4f6bff,
    saludo: 'No te acerques a la prensa tres. Ahí abajo se quedó mi camada.',
  },
  olvido: {
    id: 'olvido',
    nombre: 'NADIE',
    sprite: 'white',
    zona: 'z2',
    emocion: 'olvido',
    color: 0xd7e3ff,
    saludo: '¿Nos conocemos? Perdona. Lo pregunto mucho. A veces dos veces seguidas.',
  },
  miedo: {
    id: 'miedo',
    nombre: 'SIRENA',
    sprite: 'siamese',
    zona: 'z3',
    emocion: 'miedo',
    color: 0x3fe0d0,
    saludo: 'No enciendas las bombas todavía. El agua hace un ruido que no me gusta.',
  },
  codicia: {
    id: 'codicia',
    nombre: 'TRÁFICO',
    sprite: 'threecolor',
    zona: 'z4',
    emocion: 'codicia',
    color: 0xffb347,
    saludo: 'Recuerdos de primera. Sin dueño. Casi sin dueño. ¿Te interesa uno tuyo?',
  },
  ira: {
    id: 'ira',
    nombre: 'COLMILLO',
    sprite: 'tiger',
    zona: 'z5',
    emocion: 'ira',
    color: 0xff4d6d,
    saludo: 'Este barrio es mío hasta que la ciudad se apague. O sea, hasta el martes.',
  },
  esperanza: {
    id: 'esperanza',
    nombre: 'SEMILLA',
    sprite: 'brown',
    zona: 'z6',
    emocion: 'esperanza',
    color: 0x7dff9b,
    saludo: 'Todavía quedan humanos. Los he oído respirar detrás del cristal. En serio.',
  },
  aceptacion: {
    id: 'aceptacion',
    nombre: 'ÁMBAR',
    sprite: 'egypt',
    zona: 'z7',
    emocion: 'aceptacion',
    color: 0xffd76e,
    saludo: 'Ya sabes lo que hay arriba, ¿verdad? No hace falta que lo digas.',
  },
  mother: {
    id: 'mother',
    nombre: 'MOTHER',
    sprite: 'demonic',
    zona: 'tower',
    emocion: 'verdad',
    color: 0xff2f6d,
    saludo: 'Te he dejado llegar hasta aquí, NOVA-7. Ahora quiero que mires.',
  },
};

export const PLAYER_SPRITE = 'classical';

/** Todas las variantes de gato disponibles en `public/assets/cats/`. */
export const CAT_VARIANTS = [
  'classical',
  'black',
  'white',
  'brown',
  'siamese',
  'tiger',
  'threecolor',
  'demonic',
  'egypt',
  'batman',
  'xmas',
] as const;

export type CatVariant = (typeof CAT_VARIANTS)[number];

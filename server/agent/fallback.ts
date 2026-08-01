import type { AgentChatResponse, NpcId } from '../../shared/types';

/**
 * Diálogos escritos a mano. Se usan si no hay `GEMINI_API_KEY` o si la llamada al
 * modelo falla: el juego debe seguir siendo jugable sin conexión.
 */
const LINEAS: Record<NpcId, string[]> = {
  duelo: [
    'La prensa tres sigue funcionando. No sé para quién.',
    'Aquí abajo el aceite huele a metal caliente. Antes olía a otra cosa.',
    'Ve tú. Yo me quedo escuchando, por si acaso.',
  ],
  olvido: [
    '¿Nos conocemos? Perdona. Lo pregunto mucho.',
    'Lo apunté en algún sitio. Nunca encuentro dónde.',
    'Me llamo... espera. Me llamaba algo. Da igual, es un nombre bonito.',
  ],
  miedo: [
    '¿Lo oyes? Eso no estaba antes. Te juro que no estaba.',
    'No enciendas la bomba uno. La uno hace ese ruido.',
    'Voy contigo. No porque sea valiente. Porque aquí solo no.',
  ],
  codicia: [
    'Recuerdos de primera. Casi sin dueño. ¿Te interesa uno tuyo?',
    'Esto normalmente cuesta media semana de energía. Para ti, excepción.',
    'No me mires así. Alguien tenía que guardarlos.',
  ],
  ira: [
    '¿Quién eres tú y qué haces en mi tejado?',
    'Este barrio es mío hasta que la ciudad se apague. O sea, hasta el martes.',
    'Nadie nos preguntó si queríamos estar aquí. A ti tampoco, supongo.',
  ],
  esperanza: [
    'Detrás del cristal hay alguien respirando. Lo he oído tres veces.',
    'Estas hojas están calientes. Eso significa que crecen, ¿no?',
    'Si te equivocas, buscas otra prueba. No es tan difícil.',
  ],
  aceptacion: [
    'Ya sabes lo que hay arriba, ¿verdad? No hace falta que lo digas.',
    'No tengas prisa por entenderlo. Llega solo.',
    'Los racks respiran. Es el ventilador, pero yo digo que respiran.',
  ],
  mother: [
    'Te he dejado llegar hasta aquí, NOVA-7.',
    'No he mantenido viva una ciudad. He mantenido viva otra cosa.',
    'Cuatrocientos años son muchos turnos de guardia.',
  ],
};

/** Rota las líneas según el turno para que no repita siempre la primera. */
export function fallbackReply(npcId: NpcId, turno: number): AgentChatResponse {
  const lineas = LINEAS[npcId] ?? ['...'];
  return {
    reply: lineas[turno % lineas.length],
    effects: [],
    toolTrace: [],
    fallback: true,
  };
}

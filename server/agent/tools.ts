import { Type, type FunctionDeclaration } from '@google/genai';
import {
  ABILITY_NAMES,
  HINTS,
  MEMORY_FRAGMENTS,
  ZONES,
  fragmentsOfZone,
  getFragment,
} from '../../shared/lore';
import type {
  AbilityId,
  AgentEffect,
  Emotion,
  GameStateSnapshot,
  NpcId,
  ZoneId,
} from '../../shared/types';
import type { ConversationMemory } from './memory';

/**
 * Contexto que reciben las herramientas. El servidor NO muta el estado del juego:
 * las herramientas que afectan al mundo acumulan efectos en `effects`, y el
 * cliente los aplica al recibir la respuesta.
 */
export interface ToolContext {
  npcId: NpcId;
  snapshot: GameStateSnapshot;
  memory: ConversationMemory;
  effects: AgentEffect[];
}

export type ToolImpl = (
  args: Record<string, unknown>,
  ctx: ToolContext,
) => unknown | Promise<unknown>;

const str = (value: unknown) => (typeof value === 'string' ? value : undefined);
const num = (value: unknown) => (typeof value === 'number' ? value : undefined);

const EMOTIONS: Emotion[] = [
  'neutral',
  'duelo',
  'olvido',
  'miedo',
  'codicia',
  'ira',
  'esperanza',
  'aceptacion',
  'verdad',
];

/** Declaraciones que se envían a Gemini. */
export const TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: 'consultar_estado_jugador',
    description:
      'Devuelve el estado actual de NOVA-7: zona, habilidades desbloqueadas, número de fragmentos de memoria recogidos, nivel de corrupción de la simulación y banderas narrativas. Úsalo antes de afirmar cualquier cosa sobre lo que Nova sabe o puede hacer.',
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: 'recuperar_fragmento_memoria',
    description:
      'Busca en el archivo canónico de recuerdos. Puedes filtrar por zona o buscar por tema. Devuelve solo el texto superficial salvo que la verdad ya haya sido revelada. Úsalo cuando necesites hablar de un recuerdo concreto en vez de inventarlo.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        zona: {
          type: Type.STRING,
          description: 'Id de zona: z1..z7 o tower. Opcional.',
        },
        busqueda: {
          type: Type.STRING,
          description: 'Palabras clave a buscar en el título o el texto. Opcional.',
        },
      },
    },
  },
  {
    name: 'otorgar_fragmento_memoria',
    description:
      'Entrega a Nova un fragmento de memoria concreto que este personaje tenía guardado. Solo fragmentos que existan en el archivo y que Nova no tenga ya. Úsalo como recompensa narrativa, no en cada mensaje.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: 'Id del fragmento, por ejemplo m07.' },
      },
      required: ['id'],
    },
  },
  {
    name: 'consultar_historial_conversacion',
    description:
      'Recupera los resúmenes de lo que ya has hablado con Nova en encuentros anteriores. Úsalo al empezar una conversación para no repetirte y para mantener la continuidad.',
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: 'registrar_recuerdo',
    description:
      'Guarda un resumen de una frase de lo que acabáis de hablar, para recordarlo en futuros encuentros. Úsalo al final de un intercambio significativo.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        resumen: { type: Type.STRING, description: 'Una frase en tercera persona.' },
      },
      required: ['resumen'],
    },
  },
  {
    name: 'revelar_pista',
    description:
      'Devuelve una pista del acertijo de la zona actual. `nivel` 0 es vaga y 2 es la solución. Empieza siempre por la más vaga; solo sube de nivel si Nova insiste o dice estar atascada.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        nivel: { type: Type.INTEGER, description: '0, 1 o 2.' },
      },
      required: ['nivel'],
    },
  },
  {
    name: 'cambiar_emocion',
    description:
      'Ajusta tu estado emocional visible: cambia tu tinte y tu postura en pantalla. Úsalo cuando la conversación te afecte de verdad.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        emocion: {
          type: Type.STRING,
          description: `Una de: ${EMOTIONS.join(', ')}.`,
        },
      },
      required: ['emocion'],
    },
  },
  {
    name: 'corromper_realidad',
    description:
      'Degrada un poco más la simulación (glitches visuales, lluvia invertida, carteles que cambian). Úsalo solo cuando la conversación roce una verdad que el sistema preferiría ocultar. Máximo 0.15 por turno.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        cantidad: { type: Type.NUMBER, description: 'Entre 0.01 y 0.15.' },
        motivo: { type: Type.STRING, description: 'Qué verdad se ha rozado.' },
      },
      required: ['cantidad'],
    },
  },
  {
    name: 'despedirse_para_siempre',
    description:
      'Tu propósito está cumplido: te desintegras en partículas luminosas y no vuelves a aparecer. Úsalo solo cuando hayas dado a Nova lo que necesitaba de ti y la despedida tenga peso. Es irreversible.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        ultimasPalabras: { type: Type.STRING, description: 'Lo último que dices.' },
      },
    },
  },
];

/** Implementaciones. Los errores se devuelven como datos para que el modelo reaccione. */
export const TOOL_IMPLS: Record<string, ToolImpl> = {
  consultar_estado_jugador(_args, ctx) {
    const { snapshot } = ctx;
    return {
      zona: snapshot.zona,
      zonaNombre: ZONES[snapshot.zona].nombre,
      ambiente: ZONES[snapshot.zona].ambiente,
      habilidades: snapshot.habilidades.map((a: AbilityId) => ABILITY_NAMES[a]),
      fragmentosRecogidos: snapshot.fragmentos.length,
      fragmentosTotales: MEMORY_FRAGMENTS.length,
      corrupcion: snapshot.corrupcion,
      acertijoResuelto: snapshot.flags.acertijosResueltos.includes(snapshot.zona),
      verdadRevelada: snapshot.flags.verdadRevelada,
      torreAlcanzada: snapshot.flags.torreAlcanzada,
    };
  },

  recuperar_fragmento_memoria(args, ctx) {
    const zona = str(args.zona) as ZoneId | undefined;
    const busqueda = str(args.busqueda)?.toLowerCase();

    let pool = zona && ZONES[zona] ? fragmentsOfZone(zona) : MEMORY_FRAGMENTS;
    if (busqueda) {
      pool = pool.filter(
        (f) =>
          f.titulo.toLowerCase().includes(busqueda) || f.texto.toLowerCase().includes(busqueda),
      );
    }
    if (pool.length === 0) return { encontrados: 0, aviso: 'No hay nada así en el archivo.' };

    const revelada = ctx.snapshot.flags.verdadRevelada;
    return {
      encontrados: pool.length,
      fragmentos: pool.slice(0, 4).map((f) => ({
        id: f.id,
        titulo: f.titulo,
        texto: f.texto,
        yaLoTieneNova: ctx.snapshot.fragmentos.includes(f.id),
        ...(revelada ? { verdad: f.verdad } : {}),
      })),
    };
  },

  otorgar_fragmento_memoria(args, ctx) {
    const id = str(args.id);
    const fragment = id ? getFragment(id) : undefined;
    if (!fragment) return { ok: false, motivo: `No existe el fragmento "${id}".` };
    if (ctx.snapshot.fragmentos.includes(fragment.id)) {
      return { ok: false, motivo: 'Nova ya tiene ese fragmento.' };
    }
    ctx.effects.push({ type: 'grantFragment', id: fragment.id });
    return { ok: true, titulo: fragment.titulo };
  },

  consultar_historial_conversacion(_args, ctx) {
    const recuerdos = ctx.memory.get(ctx.npcId);
    return {
      encuentrosPrevios: recuerdos.length,
      recuerdos,
    };
  },

  registrar_recuerdo(args, ctx) {
    const resumen = str(args.resumen)?.trim();
    if (!resumen) return { ok: false, motivo: 'Resumen vacío.' };
    ctx.memory.add(ctx.npcId, resumen.slice(0, 240));
    return { ok: true };
  },

  revelar_pista(args, ctx) {
    const pistas = HINTS[ctx.snapshot.zona] ?? [];
    if (pistas.length === 0) return { ok: false, motivo: 'Esta zona no tiene acertijo.' };

    const nivel = Math.max(0, Math.min(pistas.length - 1, num(args.nivel) ?? 0));
    const texto = pistas[nivel];
    ctx.effects.push({ type: 'showHint', text: texto });
    return { ok: true, nivel, pista: texto, acertijo: ZONES[ctx.snapshot.zona].acertijo };
  },

  cambiar_emocion(args, ctx) {
    const emocion = str(args.emocion) as Emotion | undefined;
    if (!emocion || !EMOTIONS.includes(emocion)) {
      return { ok: false, motivo: `Emoción no válida. Usa una de: ${EMOTIONS.join(', ')}.` };
    }
    ctx.effects.push({ type: 'setEmotion', emotion: emocion });
    return { ok: true, emocion };
  },

  corromper_realidad(args, ctx) {
    const cantidad = Math.max(0.01, Math.min(0.15, num(args.cantidad) ?? 0.05));
    ctx.effects.push({ type: 'corruptReality', amount: cantidad });
    return { ok: true, cantidad, corrupcionPrevia: ctx.snapshot.corrupcion };
  },

  despedirse_para_siempre(args, ctx) {
    if (ctx.npcId === 'mother') {
      return { ok: false, motivo: 'MOTHER no puede desaparecer. Ella es el sistema.' };
    }
    ctx.effects.push({ type: 'npcDissolve', npcId: ctx.npcId });
    return { ok: true, ultimasPalabras: str(args.ultimasPalabras) ?? null };
  },
};

import { describe, expect, it, beforeEach, vi } from 'vitest';
import type { GoogleGenAI } from '@google/genai';
import { runAgentTurn, resetHistory, type AgentDeps } from '../server/agent/loop';
import { ConversationMemory } from '../server/agent/memory';
import { TOOL_DECLARATIONS, TOOL_IMPLS, type ToolContext } from '../server/agent/tools';
import { DEFAULT_FLAGS, type AgentChatRequest, type GameStateSnapshot } from '../shared/types';
import { MEMORY_FRAGMENTS } from '../shared/lore';

const snapshot: GameStateSnapshot = {
  zona: 'z1',
  habilidades: ['doubleJump'],
  fragmentos: ['m01'],
  corrupcion: 0.2,
  flags: { ...DEFAULT_FLAGS },
};

const request: AgentChatRequest = {
  npcId: 'duelo',
  playerMessage: '¿Qué pasó aquí?',
  gameState: snapshot,
};

/** Construye un doble de Gemini que devuelve las respuestas indicadas en orden. */
function fakeAi(turns: Array<{ text?: string; functionCalls?: Array<{ name: string; args: Record<string, unknown> }> }>) {
  const generateContent = vi.fn();
  for (const turn of turns) {
    generateContent.mockResolvedValueOnce({
      text: turn.text,
      functionCalls: turn.functionCalls,
    });
  }
  return { ai: { models: { generateContent } } as unknown as GoogleGenAI, generateContent };
}

function deps(ai: GoogleGenAI | null, memory = new ConversationMemory()): AgentDeps {
  return { ai, model: 'test-model', memory, maxSteps: 6, timeoutMs: 5000 };
}

beforeEach(() => resetHistory());

describe('runAgentTurn', () => {
  it('devuelve el diálogo de reserva si no hay cliente de Gemini', async () => {
    const result = await runAgentTurn(request, deps(null));
    expect(result.fallback).toBe(true);
    expect(result.reply.length).toBeGreaterThan(0);
    expect(result.effects).toEqual([]);
  });

  it('devuelve el texto del modelo cuando no pide herramientas', async () => {
    const { ai } = fakeAi([{ text: 'Aquí abajo se quedó mi camada.' }]);
    const result = await runAgentTurn(request, deps(ai));

    expect(result.fallback).toBe(false);
    expect(result.reply).toBe('Aquí abajo se quedó mi camada.');
    expect(result.toolTrace).toEqual([]);
  });

  it('ejecuta las herramientas pedidas y devuelve sus efectos', async () => {
    const { ai, generateContent } = fakeAi([
      {
        functionCalls: [
          { name: 'consultar_estado_jugador', args: {} },
          { name: 'cambiar_emocion', args: { emocion: 'duelo' } },
        ],
      },
      { text: 'No te acerques a la prensa tres.' },
    ]);

    const result = await runAgentTurn(request, deps(ai));

    expect(generateContent).toHaveBeenCalledTimes(2);
    expect(result.toolTrace.map((t) => t.name)).toEqual([
      'consultar_estado_jugador',
      'cambiar_emocion',
    ]);
    expect(result.effects).toEqual([{ type: 'setEmotion', emotion: 'duelo' }]);
    expect(result.reply).toBe('No te acerques a la prensa tres.');
  });

  it('reenvía los resultados de las herramientas al modelo en el turno siguiente', async () => {
    const { ai, generateContent } = fakeAi([
      { functionCalls: [{ name: 'consultar_estado_jugador', args: {} }] },
      { text: 'Ya sabes saltar dos veces.' },
    ]);

    await runAgentTurn(request, deps(ai));

    // `contents` se muta en el sitio, así que buscamos la parte por tipo en vez
    // de asumir que sigue siendo la última cuando termina el turno.
    const contents = generateContent.mock.calls[1][0].contents as Array<{
      parts?: Array<{ functionResponse?: { name: string; response: Record<string, unknown> } }>;
    }>;
    const responses = contents
      .flatMap((c) => c.parts ?? [])
      .map((p) => p.functionResponse)
      .filter(Boolean);

    expect(responses).toHaveLength(1);
    expect(responses[0]!.name).toBe('consultar_estado_jugador');
    expect(responses[0]!.response.zona).toBe('z1');
  });

  it('limpia markdown y acotaciones que el modelo cuele', async () => {
    const { ai } = fakeAi([{ text: '  *se gira despacio*  Vete.\n\n' }]);
    const result = await runAgentTurn(request, deps(ai));
    expect(result.reply).toBe('se gira despacio Vete.');
  });

  it('cae en el diálogo de reserva si el modelo falla', async () => {
    const generateContent = vi.fn().mockRejectedValue(new Error('503'));
    const ai = { models: { generateContent } } as unknown as GoogleGenAI;

    const result = await runAgentTurn(request, deps(ai));
    expect(result.fallback).toBe(true);
  });

  it('nunca supera maxSteps aunque el modelo pida herramientas sin parar', async () => {
    const generateContent = vi.fn().mockResolvedValue({
      functionCalls: [{ name: 'consultar_estado_jugador', args: {} }],
    });
    const ai = { models: { generateContent } } as unknown as GoogleGenAI;

    const result = await runAgentTurn(request, { ...deps(ai), maxSteps: 3 });
    expect(generateContent).toHaveBeenCalledTimes(3);
    expect(result.fallback).toBe(true);
  });
});

describe('herramientas', () => {
  let ctx: ToolContext;

  beforeEach(() => {
    ctx = {
      npcId: 'duelo',
      snapshot,
      memory: new ConversationMemory(),
      effects: [],
    };
  });

  it('declara todas las herramientas implementadas, y solo esas', () => {
    const declaradas = TOOL_DECLARATIONS.map((d) => d.name).sort();
    const implementadas = Object.keys(TOOL_IMPLS).sort();
    expect(declaradas).toEqual(implementadas);
  });

  it('todas las declaraciones tienen nombre y descripción', () => {
    for (const decl of TOOL_DECLARATIONS) {
      expect(decl.name, 'nombre').toBeTruthy();
      expect(decl.description?.length ?? 0, `descripción de ${decl.name}`).toBeGreaterThan(30);
    }
  });

  it('no otorga un fragmento que Nova ya tiene', async () => {
    const result = (await TOOL_IMPLS.otorgar_fragmento_memoria({ id: 'm01' }, ctx)) as {
      ok: boolean;
    };
    expect(result.ok).toBe(false);
    expect(ctx.effects).toEqual([]);
  });

  it('otorga un fragmento nuevo y existente', async () => {
    const nuevo = MEMORY_FRAGMENTS.find((f) => f.id !== 'm01')!;
    const result = (await TOOL_IMPLS.otorgar_fragmento_memoria({ id: nuevo.id }, ctx)) as {
      ok: boolean;
    };
    expect(result.ok).toBe(true);
    expect(ctx.effects).toEqual([{ type: 'grantFragment', id: nuevo.id }]);
  });

  it('rechaza fragmentos inventados', async () => {
    const result = (await TOOL_IMPLS.otorgar_fragmento_memoria({ id: 'inventado' }, ctx)) as {
      ok: boolean;
    };
    expect(result.ok).toBe(false);
  });

  it('oculta la verdad de los fragmentos hasta que se revela', async () => {
    const oculto = (await TOOL_IMPLS.recuperar_fragmento_memoria({ zona: 'z1' }, ctx)) as {
      fragmentos: Array<Record<string, unknown>>;
    };
    expect(oculto.fragmentos[0]).not.toHaveProperty('verdad');

    ctx.snapshot = { ...snapshot, flags: { ...DEFAULT_FLAGS, verdadRevelada: true } };
    const revelado = (await TOOL_IMPLS.recuperar_fragmento_memoria({ zona: 'z1' }, ctx)) as {
      fragmentos: Array<Record<string, unknown>>;
    };
    expect(revelado.fragmentos[0]).toHaveProperty('verdad');
  });

  it('limita la corrupción por turno a 0.15', async () => {
    await TOOL_IMPLS.corromper_realidad({ cantidad: 5 }, ctx);
    expect(ctx.effects).toEqual([{ type: 'corruptReality', amount: 0.15 }]);
  });

  it('acota el nivel de pista al rango disponible', async () => {
    const result = (await TOOL_IMPLS.revelar_pista({ nivel: 99 }, ctx)) as {
      nivel: number;
      pista: string;
    };
    expect(result.nivel).toBe(2);
    expect(ctx.effects).toEqual([{ type: 'showHint', text: result.pista }]);
  });

  it('rechaza emociones que no existen', async () => {
    const result = (await TOOL_IMPLS.cambiar_emocion({ emocion: 'euforia' }, ctx)) as {
      ok: boolean;
    };
    expect(result.ok).toBe(false);
    expect(ctx.effects).toEqual([]);
  });

  it('impide que MOTHER se despida para siempre', async () => {
    ctx.npcId = 'mother';
    const result = (await TOOL_IMPLS.despedirse_para_siempre({}, ctx)) as { ok: boolean };
    expect(result.ok).toBe(false);
    expect(ctx.effects).toEqual([]);
  });

  it('registra y recupera la memoria de conversación por NPC', async () => {
    await TOOL_IMPLS.registrar_recuerdo({ resumen: 'Nova preguntó por la prensa tres.' }, ctx);
    const historial = (await TOOL_IMPLS.consultar_historial_conversacion({}, ctx)) as {
      encuentrosPrevios: number;
      recuerdos: string[];
    };
    expect(historial.encuentrosPrevios).toBe(1);
    expect(historial.recuerdos[0]).toContain('prensa tres');

    // La memoria es por NPC: otro gato no ve estos recuerdos.
    ctx.npcId = 'miedo';
    const otro = (await TOOL_IMPLS.consultar_historial_conversacion({}, ctx)) as {
      encuentrosPrevios: number;
    };
    expect(otro.encuentrosPrevios).toBe(0);
  });
});

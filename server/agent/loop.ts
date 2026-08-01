import type { Content, GoogleGenAI, Part } from '@google/genai';
import { buildSystemPrompt } from './personas';
import { TOOL_DECLARATIONS, TOOL_IMPLS, type ToolContext } from './tools';
import type { ConversationMemory } from './memory';
import { fallbackReply } from './fallback';
import type {
  AgentChatRequest,
  AgentChatResponse,
  AgentEffect,
  ToolTraceEntry,
} from '../../shared/types';

export interface AgentDeps {
  ai: GoogleGenAI | null;
  model: string;
  memory: ConversationMemory;
  maxSteps: number;
  timeoutMs: number;
}

/** Historial en memoria por NPC, para que el diálogo tenga continuidad dentro de la sesión. */
const historial = new Map<string, Content[]>();
const MAX_HISTORY_TURNS = 12;

export function resetHistory(npcId?: string) {
  if (npcId) historial.delete(npcId);
  else historial.clear();
}

/**
 * Bucle de tool use.
 *
 * 1. Se envía el mensaje del jugador con las declaraciones de herramientas.
 * 2. Si el modelo pide llamadas a función, se ejecutan y se le devuelven los
 *    resultados como `functionResponse`.
 * 3. Se repite hasta que responde con texto o hasta `maxSteps`.
 *
 * Las herramientas que afectan al mundo no mutan nada aquí: acumulan efectos que
 * el cliente aplica sobre su propio `GameState`, que es la fuente de verdad.
 */
export async function runAgentTurn(
  request: AgentChatRequest,
  deps: AgentDeps,
): Promise<AgentChatResponse> {
  const { ai, model, memory, maxSteps, timeoutMs } = deps;
  const previos = historial.get(request.npcId) ?? [];

  if (!ai) return fallbackReply(request.npcId, previos.length);

  const effects: AgentEffect[] = [];
  const toolTrace: ToolTraceEntry[] = [];
  const ctx: ToolContext = {
    npcId: request.npcId,
    snapshot: request.gameState,
    memory,
    effects,
  };

  const contents: Content[] = [
    ...previos,
    { role: 'user', parts: [{ text: request.playerMessage }] },
  ];

  const deadline = Date.now() + timeoutMs;

  try {
    for (let step = 0; step < maxSteps; step++) {
      if (Date.now() > deadline) throw new Error('timeout del turno del agente');

      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: buildSystemPrompt(request.npcId, request.gameState),
          tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
          temperature: 0.95,
          maxOutputTokens: 400,
        },
      });

      const calls = response.functionCalls ?? [];

      if (calls.length === 0) {
        const reply = (response.text ?? '').trim();
        if (!reply) break;

        contents.push({ role: 'model', parts: [{ text: reply }] });
        historial.set(request.npcId, trimHistory(contents));
        await memory.flush();
        return { reply: clean(reply), effects, toolTrace, fallback: false };
      }

      // Registrar la intención del modelo antes de ejecutar nada.
      contents.push({
        role: 'model',
        parts: calls.map((call) => ({ functionCall: call })),
      });

      const responses: Part[] = [];
      for (const call of calls) {
        const name = call.name ?? '';
        const args = (call.args ?? {}) as Record<string, unknown>;
        const impl = TOOL_IMPLS[name];

        const result = impl
          ? await safeCall(impl, args, ctx)
          : { error: `Herramienta desconocida: ${name}` };

        toolTrace.push({ name, args, result });
        responses.push({
          functionResponse: {
            id: call.id,
            name,
            // Gemini espera un objeto en `response`.
            response: asRecord(result),
          },
        });
      }
      contents.push({ role: 'user', parts: responses });
    }

    // Se agotaron los pasos sin texto: mejor una línea escrita que un silencio.
    const fb = fallbackReply(request.npcId, previos.length);
    return { ...fb, effects, toolTrace };
  } catch (error) {
    console.warn('[agent] fallo en el turno, se usa el diálogo de reserva:', error);
    const fb = fallbackReply(request.npcId, previos.length);
    return { ...fb, effects, toolTrace };
  }
}

async function safeCall(
  impl: (args: Record<string, unknown>, ctx: ToolContext) => unknown,
  args: Record<string, unknown>,
  ctx: ToolContext,
) {
  try {
    return await impl(args, ctx);
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

const asRecord = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : { valor: value };

/** Recorta el historial para no crecer sin límite dentro de una sesión larga. */
function trimHistory(contents: Content[]): Content[] {
  // Se conservan solo los turnos de texto: las llamadas a herramienta no aportan
  // contexto útil en encuentros posteriores y consumen muchos tokens.
  const soloTexto = contents.filter((c) => c.parts?.some((p) => typeof p.text === 'string'));
  return soloTexto.slice(-MAX_HISTORY_TURNS);
}

/** El modelo a veces cuela markdown o acotaciones a pesar del prompt. */
function clean(text: string): string {
  return text
    .replace(/\*+/g, '')
    .replace(/^\s*[-–]\s*/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 400);
}

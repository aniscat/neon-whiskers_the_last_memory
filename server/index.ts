import 'dotenv/config';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { ConversationMemory } from './agent/memory';
import { runAgentTurn, resetHistory, type AgentDeps } from './agent/loop';
import { NPCS } from '../shared/npcs';
import { DEFAULT_FLAGS } from '../shared/types';
import type { AgentChatRequest } from '../shared/types';

const PORT = Number(process.env.PORT ?? 8787);
const MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';
const API_KEY = process.env.GEMINI_API_KEY?.trim();

const memory = new ConversationMemory();
await memory.load();

const deps: AgentDeps = {
  ai: API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null,
  model: MODEL,
  memory,
  maxSteps: Number(process.env.AGENT_MAX_STEPS ?? 6),
  timeoutMs: Number(process.env.AGENT_TIMEOUT_MS ?? 25000),
};

if (!deps.ai) {
  console.warn(
    '[server] GEMINI_API_KEY no está definida: el agente usará los diálogos de reserva.',
  );
}

const npcIds = Object.keys(NPCS) as [keyof typeof NPCS, ...Array<keyof typeof NPCS>];

const snapshotSchema = z.object({
  zona: z.enum(['z1', 'z2', 'z3', 'z4', 'z5', 'z6', 'z7', 'tower']),
  habilidades: z.array(z.string()).max(20),
  fragmentos: z.array(z.string()).max(100),
  corrupcion: z.number().min(0).max(1),
  flags: z
    .object({
      torreAlcanzada: z.boolean(),
      verdadRevelada: z.boolean(),
      nucleoDestruido: z.boolean(),
      acertijosResueltos: z.array(z.string()).max(20),
      npcsDisueltos: z.array(z.string()).max(20),
    })
    .partial()
    .transform((flags) => ({ ...DEFAULT_FLAGS, ...flags })),
});

const chatSchema = z.object({
  npcId: z.enum(npcIds),
  // Un límite corto evita inyecciones largas y controla el coste.
  playerMessage: z.string().trim().min(1).max(400),
  gameState: snapshotSchema,
});

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '32kb' }));

/** Límite por IP muy simple: suficiente para un juego de un jugador. */
const hits = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 40;

app.use('/api/agent', (req, res, next) => {
  const ip = req.ip ?? 'anon';
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    res.status(429).json({ error: 'Demasiadas peticiones. Espera un momento.' });
    return;
  }
  recent.push(now);
  hits.set(ip, recent);
  next();
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, agente: deps.ai ? 'gemini' : 'fallback', model: MODEL });
});

app.post('/api/agent/chat', async (req, res) => {
  const parsed = chatSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Petición inválida', detalle: parsed.error.issues });
    return;
  }

  try {
    const result = await runAgentTurn(parsed.data as AgentChatRequest, deps);
    res.json(result);
  } catch (error) {
    console.error('[server] error inesperado en /api/agent/chat:', error);
    res.status(500).json({ error: 'El agente no pudo responder.' });
  }
});

/** Reinicia el historial y la memoria persistente (partida nueva). */
app.post('/api/agent/reset', async (_req, res) => {
  resetHistory();
  memory.reset();
  await memory.flush();
  res.json({ ok: true });
});

/**
 * En producción (contenedor) el mismo proceso sirve el juego ya compilado, así
 * que no hace falta un segundo servidor ni configurar CORS entre orígenes.
 * En desarrollo esta carpeta no existe y Vite se encarga del cliente.
 */
const DIST = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
if (existsSync(DIST)) {
  app.use(express.static(DIST, { maxAge: '1h', index: false }));
  app.get(/^\/(?!api\/).*/, (_req, res) => {
    res.sendFile(join(DIST, 'index.html'));
  });
  console.log(`[server] sirviendo el cliente desde ${DIST}`);
} else {
  console.log('[server] sin build de cliente: se espera el servidor de desarrollo de Vite');
}

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[server] escuchando en http://localhost:${PORT}`);
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    void memory.flush().finally(() => server.close(() => process.exit(0)));
  });
}

import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@shared': fileURLToPath(new URL('./shared', import.meta.url)),
    },
  },
  test: {
    // Solo se prueban módulos puros (agente, lore, definiciones de nivel), así que
    // no hace falta simular un navegador.
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});

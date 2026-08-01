import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const SERVER_PORT = process.env.PORT ?? '8787';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@shared': fileURLToPath(new URL('./shared', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    // `true` escucha en 0.0.0.0, necesario para que el contenedor sea accesible.
    host: true,
    proxy: {
      '/api': {
        target: `http://localhost:${SERVER_PORT}`,
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'es2022',
    // Phaser es grande; separarlo mantiene el bundle de juego cacheable por separado.
    rollupOptions: {
      output: {
        manualChunks: { phaser: ['phaser'] },
      },
    },
  },
});

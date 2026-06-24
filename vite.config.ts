/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// glpk.js usa um worker/WASM; em produção o Vite serve os assets automaticamente.
export default defineConfig({
  plugins: [react()],
  // glpk.js é CommonJS + traz arquivos .wasm — evita pré-bundle agressivo que quebra o worker.
  optimizeDeps: {
    exclude: ['glpk.js'],
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
});

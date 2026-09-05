import { defineConfig } from 'vitest/config';

// Config separada do vite.config.js: os testes de unidade cobrem apenas
// funcoes puras (traducao de erros, formatacao), sem precisar do plugin
// React nem do fallback de SPA usados no build/dev do app.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.js']
  }
});

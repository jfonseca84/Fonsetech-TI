import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Duas entradas:
 *   index.html -> landing page publica (HTML estatico, sem React)
 *   app.html   -> shell da SPA (login, /dashboard, /admin)
 *
 * Em producao o server.js decide qual arquivo responde cada rota.
 * Em desenvolvimento o middleware abaixo faz o mesmo papel.
 */
const fallbackDaSpa = {
  name: 'fonsetech-spa-fallback',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const rota = (req.url || '/').split('?')[0];
      const aceitaHtml = (req.headers.accept || '').includes('text/html');
      const ehArquivo = rota.includes('.') || rota.startsWith('/@') || rota.startsWith('/src/') || rota.startsWith('/node_modules/');
      if (req.method === 'GET' && aceitaHtml && !ehArquivo && rota !== '/') {
        req.url = '/app.html';
      }
      next();
    });
  }
};

export default defineConfig({
  plugins: [react(), fallbackDaSpa],
  server: { host: '0.0.0.0', port: 3000 },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      input: {
        index: 'index.html',
        app: 'app.html'
      },
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js']
        }
      }
    }
  }
});

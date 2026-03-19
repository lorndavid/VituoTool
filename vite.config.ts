import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      nodePolyfills({
        include: ['crypto', 'buffer', 'stream', 'http', 'https', 'zlib', 'util'],
        globals: {
          Buffer: true,
          global: true,
          process: true,
        },
      }),
      // Custom plugin to aggressively block problematic modules
      {
        name: 'block-fetch-polyfills',
        enforce: 'pre',
        resolveId(id) {
          if (id === 'node-fetch' || id.startsWith('node-fetch/')) {
            return path.resolve(__dirname, 'src/fetch-shim.ts');
          }
          if (
            id === 'fetch-blob' || 
            id.startsWith('fetch-blob/') || 
            id === 'formdata-polyfill' || 
            id.startsWith('formdata-polyfill/')
          ) {
            return path.resolve(__dirname, 'src/empty-shim.ts');
          }
          return null;
        }
      }
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: [
        { find: '@', replacement: path.resolve(__dirname, '.') },
        { find: 'node-fetch', replacement: path.resolve(__dirname, 'src/fetch-shim.ts') },
        { find: /^node-fetch\/.*/, replacement: path.resolve(__dirname, 'src/fetch-shim.ts') },
        { find: 'fetch-blob', replacement: path.resolve(__dirname, 'src/empty-shim.ts') },
        { find: /^fetch-blob\/.*/, replacement: path.resolve(__dirname, 'src/empty-shim.ts') },
        { find: 'formdata-polyfill', replacement: path.resolve(__dirname, 'src/empty-shim.ts') },
        { find: /^formdata-polyfill\/.*/, replacement: path.resolve(__dirname, 'src/empty-shim.ts') },
      ],
    },
    optimizeDeps: {
      exclude: ['node-fetch', 'fetch-blob', 'formdata-polyfill'],
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});

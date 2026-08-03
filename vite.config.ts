import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';

export default defineConfig({
  plugins: [react(), wasm()],
  server: {
    historyApiFallback: true,
  },
  preview: {
    historyApiFallback: true,
  },
});

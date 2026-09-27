import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';

const SUPPORTED_LANGS = ['en', 'ru'];

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  // Canonical, Open Graph and hreflang URLs are all built from VITE_SITE_URL.
  // When it is unset, Vite leaves the %VITE_SITE_URL% placeholders in
  // index.html untouched and the shipped page would advertise
  // "%VITE_SITE_URL%/uuid" as its canonical URL — fail the build instead.
  if (command === 'build' && !env.VITE_SITE_URL) {
    throw new Error(
      'VITE_SITE_URL is not set. Add it to .env (see .env.example) or pass it as an environment variable.'
    );
  }

  if (env.VITE_DEFAULT_LANG && !SUPPORTED_LANGS.includes(env.VITE_DEFAULT_LANG)) {
    throw new Error(
      `VITE_DEFAULT_LANG="${env.VITE_DEFAULT_LANG}" is not supported. Use one of: ${SUPPORTED_LANGS.join(', ')}.`
    );
  }

  return {
    plugins: [react(), wasm()],
    // Worker bundles are built with their own plugin list (see Vite's
    // createWorkerPlugins), so vite-plugin-wasm has to be registered again
    // here — otherwise the wasm import inside the bcrypt worker hits Vite's
    // fallback plugin and the build fails with "ESM integration proposal for
    // Wasm is not supported currently". ES output is required by the wasm glue.
    worker: {
      format: 'es',
      plugins: () => [wasm()],
    },
    build: {
      target: 'es2022',
    },
    server: {
      host: true,
    },
  };
});

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GA_MEASUREMENT_ID?: string;
  readonly VITE_SITE_URL: string;
  /** Language served on unprefixed routes. One of the supported langs; defaults to 'en'. */
  readonly VITE_DEFAULT_LANG?: 'en' | 'ru';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

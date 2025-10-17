/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ELASTICSEARCH_HOST: string;
  readonly VITE_ELASTICSEARCH_USERNAME: string;
  readonly VITE_ELASTICSEARCH_PASSWORD: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// The interfaces below provide the necessary types for import.meta.env, making the reference directive redundant in this context.

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_GEMINI_API_KEY: string;
  readonly VITE_TINYMCE_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

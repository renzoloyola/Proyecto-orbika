import { createClient } from "@supabase/supabase-js";

// Cliente de Supabase para el navegador: usa la clave "anon" (pública) y
// queda sujeto a las políticas de Row-Level Security definidas en
// supabase/migrations/001_init_schema.sql.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
